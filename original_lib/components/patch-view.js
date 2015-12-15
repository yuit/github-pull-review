// var highlightJs = require("highlight.js");
var React = require("react");
var CommentView = require("./comment-view");
var CommentBox = require("./comment-box");
var Patch = require("../logic/models/patch");
var Line = require("../logic/models/line");
var md5 = require("md5");

function createAnchorId(commitSha, filepath, lineNo, isLeft) {
    var sep = "U"; // unified; isLeft === null
    if (isLeft === true) {
        sep = "L";
    }
    else if (isLeft === false) {
        sep = "R";
    }
    // Anchor IDs need to be ASCII, but filepaths may not be ASCII, so we'll MD5
    // the file path. We also can't use querySelector nicely with leading digits,
    // so we prepend "diff-" to avoid having to munge around. As it turns out, these
    // are also the tricks GH uses.
    return "diff-" + commitSha + "-" + md5(filepath) + sep + lineNo;
}

function createCommentAnchorId(comment) {
    return "cmt-" + comment.getComment().getId();
}

module.exports = React.createClass({displayName: 'PatchView',
    propTypes: {
        showUnified: React.PropTypes.bool.isRequired,
        comments: React.PropTypes.array.isRequired,
        commitSha: React.PropTypes.string,
        patch: React.PropTypes.instanceOf(Patch),
        fileExt: React.PropTypes.string,
        onLineComment: React.PropTypes.func,
        onReplyToComment: React.PropTypes.func,
        onToggleCommits: React.PropTypes.func,
        enableComments: React.PropTypes.bool,
        filePath: React.PropTypes.string,
        onLineClick: React.PropTypes.func, // fn(lineId: String, Line)
        onCommentClick: React.PropTypes.func // fn(cmt: Comment)
    },

    getInitialState: function() {
        return {
            selectedLines: []
        };
    },

    getDefaultProps: function() {
        return {
            onToggleCommits: function() {},
            onCommentClick: function() {},
            enableComments: true
        };
    },

    onToggleCommits: function(cmt, wantPrev) {
        this.props.onToggleCommits(cmt, wantPrev);
    },

    onCommentClick: function(cmt) {
        this.props.onCommentClick(cmt, createCommentAnchorId(cmt));
    },

    componentDidUpdate: function() {
        /* FIXME: This needs to be multiline for correct highlighting (e.g. block comments)
        if (!this.refs.mainView) { return; }
        var mainDomNode = React.findDOMNode(this.refs.mainView);
        if (!mainDomNode) { return; }
        var elements = mainDomNode.getElementsByClassName(this.props.fileExt);
        for (var i = 0; i < elements.length; i++) {
            highlightJs.highlightBlock(elements[i]);
        }
        */
    },

    createAnchor: function(lineNo, isLeft) {
        if (!this.props.filePath) {
            return null;
        }
        return createAnchorId(this.props.commitSha, this.props.filePath, lineNo, isLeft);
    },

    _onLineComment: function(selectedLine, text) {
        var self = this;
        return this.props.onLineComment(selectedLine.pos, text).then(function(res) {
            // if it is submitted then de-select this line (technically this is a toggle)
            self.onLineClick(selectedLine.line, selectedLine.isOldFile);
            return res;
        });
    },

    _onReplyToComment: function(inReplyTo, text) {
        return this.props.onReplyToComment(inReplyTo, text);
    },

    _getSelectedLine: function(line, isOldFile) {
        var index = this._getSelectedLineIndex(line, isOldFile);
        return this.state.selectedLines[index];
    },

    _getSelectedLineIndex: function(line, isOldFile) {
        isOldFile = Boolean(isOldFile);
        for (var i = 0; i < this.state.selectedLines.length; i++) {
            if (this.state.selectedLines[i].line.matches(line) &&
                    this.state.selectedLines[i].isOldFile === isOldFile) {
                return i;
            }
        }
        return -1;
    },

    _getLineJsx: function(line) {
        var fileExt = this.props.fileExt || "";
        var classes = (
            fileExt + " PatchView_type_" + line.getType() + " PatchView_line_content"
        );
        var text = (
            <td className={classes}>
            {line.getRawLine()}
            </td>
        );
        if (line.hasHighlightedSection()) {
            var sections = line.getHighlightedSections();
            text = (
                <td className={classes}>
                    {sections[0]}
                    <span className={"PatchView_highlight_" + line.getType()}>
                        {sections[1]}
                    </span>
                    {sections[2]}
                </td>
            );
        }
        return text;
    },

    _getLineComments: function(line, isUnified) {
        var self = this;
        var commentsOnLine = self.props.comments.filter(function(lineComment) {
            return lineComment.isOnLine(line, isUnified);
        });
        return commentsOnLine;
    },

    onLineClick: function(line, isOldFile, ev) {
        if (!this.props.enableComments) {
            console.log("comments disabled on this view");
            return;
        }
        if (line.type === Line.TYPE_BLANK) {
            return; // this isn't part of the diff, just a placeholder for side-by-side
        }
        isOldFile = Boolean(isOldFile);
        var selectedLines = this.state.selectedLines;
        var lineIndex = this._getSelectedLineIndex(line, isOldFile);
        var lineInfo = selectedLines[lineIndex];
        if (lineInfo) {
            selectedLines.splice(lineIndex, 1);
        }
        else {
            selectedLines.push({
                line: line,
                draft: "",
                isOldFile: isOldFile,
                pos: this.props.patch.getLinePosition(line)
            });
        }
        console.log("Selected lines: %s", selectedLines.length);

        this.setState({
            selectedLines: selectedLines
        });

        if (ev && this.props.onLineClick) {
            var lineId = ev.target.id;
            this.props.onLineClick(lineId, line);
        }
    },

    getUnifiedDiffJsx: function(patch) {
        var self = this;

        var tableLines = [];

        // add in extra rows for comments - we need to do this via tableLines indirection
        // to get around React's "return one top level element please" rule
        patch.getUnifiedData().forEach(function(line, i) {
            tableLines.push(
                <tr className={"PatchView_type_" + line.getType()} key={i}>
                    <td className="PatchView_line_num"
                    onClick={self.onLineClick.bind(self, line, false)}
                    id={self.createAnchor(line.getOldFileLineNum(), null)}>
                        {line.getOldFileLineNum()}
                    </td>
                    <td className="PatchView_line_num"
                    onClick={self.onLineClick.bind(self, line, false)}
                    id={self.createAnchor(line.getNewFileLineNum(), null)}>
                        {line.getNewFileLineNum()}
                    </td>
                    {self._getLineJsx(line)}
                </tr>
            );
            // potentially add in a selected line comment box
            var selectedLine = self._getSelectedLine(line);
            if (selectedLine) {
                tableLines.push(
                    <tr key={"box" + i}>
                        <td />
                        <td />
                        <td>
                            <CommentBox
                            onSubmit={self._onLineComment.bind(self, selectedLine)} />
                        </td>
                    </tr>
                );
            }
            // add line comments
            var comments = self._getLineComments(line, true);
            comments.forEach(function(cmt, commentIndex) {
                tableLines.push(
                    <tr key={"cmt" + commentIndex}>
                        <td />
                        <td />
                        <td>
                            <CommentView comment={cmt} id={createCommentAnchorId(cmt)}
                                onToggleCommits={self.onToggleCommits.bind(self, cmt)}
                                onAnchorClick={self.onCommentClick.bind(self, cmt)} />
                        </td>
                    </tr>
                );
            });
            if (comments.length > 0) {
                // add a comment box to reply to this thread
                tableLines.push(
                    <tr key={"reply" + i}>
                        <td />
                        <td />
                        <td>
                            <CommentBox
                            onSubmit={self._onReplyToComment.bind(
                                self, comments[comments.length - 1])} />
                        </td>
                    </tr>
                )
            }
        });

        return (
            <table>
            <tbody>
            {tableLines.map(function(l) { return l; })}
            </tbody>
            </table>
        );
    },

    getSideBySideDiffJsx: function(patch) {
        var self = this;
        var tableLines = [];
        patch.getSideBySideData().old.forEach(function(leftLine, i) {
            var rightLine = patch.getSideBySideData().new[i];
            var leftLineSelected = self._getSelectedLine(leftLine, true);
            var rightLineSelected = self._getSelectedLine(rightLine, false);

            tableLines.push(
                <tr key={i}>
                <td className={"PatchView_line_num PatchView_type_" + leftLine.getType()}
                        onClick={self.onLineClick.bind(self, leftLine, true)}
                        id={self.createAnchor(leftLine.getOldFileLineNum(), true)}>
                    {leftLine.getOldFileLineNum()}
                </td>
                {self._getLineJsx(leftLine)}
                <td className={"PatchView_line_num PatchView_type_" + rightLine.getType()}
                        onClick={self.onLineClick.bind(self, rightLine, false)}
                        id={self.createAnchor(rightLine.getNewFileLineNum(), false)}>
                    {rightLine.getNewFileLineNum()}
                </td>
                {self._getLineJsx(rightLine)}
                </tr>
            );
            // potentially add row for comment box
            if (leftLineSelected || rightLineSelected) {
                var oldCommentBox, newCommentBox;
                if (leftLineSelected) {
                    oldCommentBox = (
                        <CommentBox
                            onSubmit={self._onLineComment.bind(self, leftLineSelected)} />
                    );
                }
                if (rightLineSelected) {
                    newCommentBox = (
                        <CommentBox
                            onSubmit={self._onLineComment.bind(self, rightLineSelected)} />
                    );
                }
                tableLines.push(
                    <tr key={"box" + i}>
                        <td /> // line num
                        <td> {oldCommentBox} </td>
                        <td /> // line num
                        <td> {newCommentBox} </td>
                    </tr>
                );
            }
            // add any line comments
            var leftComments = self._getLineComments(leftLine, false);
            var rightComments = self._getLineComments(rightLine, false);
            // NOP lines will have duplicate comments for both left/right, so suppress left.
            if (leftLine.getType() === Line.TYPE_NOP && rightLine.getType() === Line.TYPE_NOP &&
                    leftComments.length > 0 && rightComments.length > 0) {
                leftComments = [];
            }
            // convert Comments into CommentViews and tack on CommentBox to ones with comments
            if (leftComments.length > 0) { leftComments.push("box"); }
            if (rightComments.length > 0) { rightComments.push("box"); }
            leftComments = leftComments.map(function(cmt) {
                if (cmt === "box") {
                    return <CommentBox
                        onSubmit={self._onReplyToComment.bind(
                        // -2 to get the last real Comment (abit naughty since we rely on this
                        // not clobbering leftComments immediately else we'd pull out a
                        // CommentView!)
                        self, leftComments[leftComments.length - 2])} />;
                }
                return <CommentView comment={cmt} id={createCommentAnchorId(cmt)}
                            onToggleCommits={self.onToggleCommits.bind(self, cmt)}
                            onAnchorClick={self.onCommentClick.bind(self, cmt)} />;
            });
            rightComments = rightComments.map(function(cmt) {
                if (cmt === "box") {
                    return <CommentBox
                        onSubmit={self._onReplyToComment.bind(
                        self, rightComments[rightComments.length - 2])} />;
                }
                return <CommentView comment={cmt} id={createCommentAnchorId(cmt)}
                            onToggleCommits={self.onToggleCommits.bind(self, cmt)}
                            onAnchorClick={self.onCommentClick.bind(self, cmt)} />;
            });

            var numRowsToAdd = Math.max(leftComments.length, rightComments.length);
            for (var j = 0; j < numRowsToAdd; j++) {
                tableLines.push(
                    <tr key={"cmt" + i + "num" + j}>
                        <td /> // line num
                        <td> {leftComments[j]} </td>
                        <td /> // line num
                        <td> {rightComments[j]} </td>
                    </tr>
                );
            }
        });

        return (
            <table className="PatchView_table">
                <tbody>
                    {tableLines.map(function(l) { return l; })}
                </tbody>
            </table>
        )
    },

    render: function() {
        var patch = this.props.patch;
        var showUnified = this.props.showUnified;
        if (!patch) {
            // possible for renamed files with no diffs.
            return (
                <div> </div>
            );
        }

        return (
            <div className="PatchView" ref="mainView">
                {showUnified ? this.getUnifiedDiffJsx(patch) : this.getSideBySideDiffJsx(patch)}
            </div>
        );
    }
});
