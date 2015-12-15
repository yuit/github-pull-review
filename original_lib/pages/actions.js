import triggers from "../logic/triggers";
import {PullRequestTrigger, FileDiffsTrigger, LineCommentsTrigger} from "../logic/triggers";
var TriggerMixin = require("../logic/triggers").TriggerMixin([
    PullRequestTrigger, FileDiffsTrigger, LineCommentsTrigger
]);

var React = require("react");
var CommentBox = require("../components/comment-box");
var CommentView = require("../components/comment-view");
var CommentDiffListView = require("../components/comment-diff-list-view");
var Actions = require("../logic/models/action");

module.exports = React.createClass({displayName: 'ActionsPage',
    mixins: [TriggerMixin],

    propTypes: {
        controller: React.PropTypes.any.isRequired
    },

    getInitialState: function() {
        return {
            actions: null,
            expanded: {}
        };
    },

    // navigating first mount
    componentDidMount: function() {
        this._loadDiffs(this.props);
    },

    // navigating once mounted
    componentWillReceiveProps: function(newProps) {
        this._loadDiffs(newProps);
    },

    componentDidUpdate: function() {
        if (this.state.actions) {
            return;
        }
        var lineCommentsTrigger = this.getTrigger(LineCommentsTrigger);
        if (lineCommentsTrigger && lineCommentsTrigger.comments) {
            this.setState({
                actions: Actions.fromLineComments(lineCommentsTrigger.comments)
            });
        }
    },

    _loadDiffs: function(props) {
        // set the pr if we already know it.
        var pullRequest = this.props.controller.getPullRequest();
        if (pullRequest) {
            var prTrigger = new triggers.PullRequestTrigger(pullRequest);
            this.setTrigger(prTrigger);
        }
        var ownerRepo = props.params.owner + "/" + props.params.repo;
        var pr = props.params.pr;
        this.props.controller.getRequestDiffs(ownerRepo, pr, false);
    },

    toggleExpand: function(actionId) {
        var expanded = this.state.expanded;
        if (expanded[actionId] === undefined) {
            expanded[actionId] = false;
        }
        expanded[actionId] = !expanded[actionId];
        this.setState({
            expanded: expanded
        })
    },

    getActionHeaderJsx: function(action, id) {
        var expandText = this.state.expanded[id] ? "Collapse" : "Expand";
        return (
            <div className="ActionsPage_action_header">
                <span className="ActionsPage_action_filepath">
                    {action.getHeadComment().getFilePath()}
                </span>
                <button onClick={this.toggleExpand.bind(this, id)}> {expandText} </button>
            </div>
        );
    },

    onSubmitLineReply: function(action, text) {
        return this.props.controller.postReplyLineComment(
            this.getTrigger(PullRequestTrigger).pr, text, action.getHeadComment()
        );
    },

    getActionJsx: function(action, index, isDone) {
        var id = isDone ? ("d" + index) : ("n" + index);
        var body;
        if (this.state.expanded[id]) {
            var cmtBox;
            if (!isDone) {
                cmtBox = (
                    <CommentBox onSubmit={this.onSubmitLineReply.bind(this, action)} />
                );
            }
            body = (
                <div>
                <CommentDiffListView
                    patch={action.getHeadComment().getPatch()}
                    comments={action.getComments()} />
                {cmtBox}
                </div>
            );
        }
        else {
            body = (
                <CommentView key={index} comment={action.getHeadComment()} />
            );
        }
        return (
            <div className="ActionsPage_action">
                {this.getActionHeaderJsx(action, id)}
                {body}
            </div>
        );
    },

    render: function() {
        var self = this;
        var pr = this.getTrigger(PullRequestTrigger).pr;
        if (!pr || !this.state.actions) {
            return <div>Loading pull request...</div>;
        }
        // var fileDiffs = this.state.file_diffs ? this.state.file_diffs.files : [];

        var notDones = this.state.actions.filter(function(a) { return !a.isDone(); });
        var dones = this.state.actions.filter(function(a) { return a.isDone(); });

        return (
            <div>
                <h2>Outstanding Line Comments</h2>
                {notDones.map(function(action, i) {
                    return self.getActionJsx(action, i, false);
                })}
                <h2>Completed Line Comments</h2>
                {dones.map(function(action, i) {
                    return self.getActionJsx(action, i, true);
                })}
            </div>
        );
    }
});
