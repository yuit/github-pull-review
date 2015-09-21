var CommentView = require("./comment-view");
var CommentBox = require("./comment-box");

module.exports = React.createClass({displayName: 'CommentsView',

    render: function() {
        if (!this.props.comments || this.props.comments.length === 0) {
            return (
                <div>
                    No comments yet.
                </div>
            );
        }
        return (
            <div>
                <div>
                {this.props.comments.map(function(comment) {
                    return (
                        <CommentView comment={comment} />
                    );
                })}
                </div>
                <CommentBox />
            </div>
        );

    }
});