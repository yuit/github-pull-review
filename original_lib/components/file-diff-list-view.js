var React = require("react");
var FileDiffView = require("./file-diff-view");

module.exports = React.createClass({displayName: 'FileDiffListView',
    propTypes: {
        onReplyToComment: React.PropTypes.func.isRequired,
        onLineComment: React.PropTypes.func.isRequired,
        controller: React.PropTypes.any.isRequired,
        diffs: React.PropTypes.array.isRequired,
        onFileLineClick: React.PropTypes.func, // fn(FileDiff, lineId, Line)
        onFileCommentClick: React.PropTypes.func, // fn(FileDiff, Comment, anchorId)
        anchorId: React.PropTypes.string
    },

    getDefaultProps: function() {
        return {
            onFileLineClick: function() {},
            onFileCommentClick: function() {}
        };
    },

    render: function() {
        if (!this.props.diffs || this.props.diffs.length === 0) {
            return (
                <div>
                    No diffs yet.
                </div>
            );
        }
        var self = this;
        var comments = this.props.comments || [];

        return (
            <div>
                <div>
                {this.props.diffs.map(function(diff, i) {
                    var fileComments = comments.filter(function(cmt) {
                        return cmt.getFilePath() === diff.getFilePath();
                    });
                    return (
                        <FileDiffView
                            diff={diff}
                            comments={fileComments}
                            pr={self.props.pr}
                            onReplyToComment={self.props.onReplyToComment}
                            onLineComment={self.props.onLineComment}
                            controller={self.props.controller}
                            key={i}
                            onLineClick={self.props.onFileLineClick}
                            onCommentClick={self.props.onFileCommentClick}
                            anchorId={self.props.anchorId} />
                    );
                })}
                </div>
            </div>
        );
    }
});
