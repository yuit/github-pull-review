"use strict";
var React = require("react");
var LineComment = require("../logic/models/line-comment");

module.exports = React.createClass({displayName: 'CommentView',
    propTypes: {
        onToggleCommits: React.PropTypes.func,
        comment: React.PropTypes.any.isRequired,
        onMarkDone: React.PropTypes.func, // presence determines checkbox
        onAnchorClick: React.PropTypes.func,
        id: React.PropTypes.string
    },

    getDefaultProps: function() {
        return {
            onToggleCommits: function() {}
        };
    },

    _onToggleCommits: function(wantEarlierCommits) {
        this.props.onToggleCommits(wantEarlierCommits);
    },

    onDoneToggle: function(ev) {
        if (!this.props.onMarkDone || !ev.target.checked) { return; }
        this.props.onMarkDone();
    },

    render: function() {
        var comment = this.props.comment;
        if (!comment) {
            return (
                <div>
                    No comment.
                </div>
            );
        }
        var lineCommentHeader;
        if (comment instanceof LineComment) {
            lineCommentHeader = (
                <span>
                    <input type="image" src="img/base2cmt.png" className="CommentView_commitToggle"
                        title="View diff when this comment was made"
                        onClick={this._onToggleCommits.bind(this, true)} />
                    <input type="image" src="img/cmt2head.png" className="CommentView_commitToggle"
                        title="View diff after this comment was made"
                        onClick={this._onToggleCommits.bind(this, false)} />
                </span>
            );
            comment = comment.getComment();
        }

        var htmlBody = comment.getHtmlBody();

        if (/<\/blockquote>$/.test(htmlBody)) {
            // TODO ends in a block quote, hide it behind a toggle button.
        }

        var doneArea;
        if (this.props.onMarkDone) {
            doneArea = (
                <label>
                    <input type="checkbox" onChange={this.onDoneToggle} />
                    Done?
                </label>
            );
        }

        var anchor;
        if (this.props.onAnchorClick) {
            anchor = <img src="img/anchor.png" className="CommentView_anchorLink"
                        onClick={this.props.onAnchorClick}/>
        }

        return (
            <div className="CommentView" id={this.props.id}>
                <img className="CommentView_avatar" src={
                    comment.getUser().getAvatarUrl()
                } />
                <div className="CommentView_header">
                    {comment.getUser().getUserLinkJsx()} commented {
                        comment.getTimeAgo()
                    } ago
                    {anchor}
                    <a href={comment.getLink()} target="_blank">(Source)</a>
                    {lineCommentHeader}
                    {doneArea}
                </div>
                <div className="CommentView_body"
                    dangerouslySetInnerHTML={{__html: htmlBody}}>
                </div>
            </div>
        );
    }
});
