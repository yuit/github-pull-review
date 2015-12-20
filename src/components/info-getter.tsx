﻿import * as React from "react"

var KEY_TOKEN = "info_access_token";
var KEY_REPO = "info_repo_id";
var KEY_REQ = "info_req_id";

export class InfoGetter extends React.Component<any, any> {
    propTypes: {
        onViewPullRequest: React.PropTypes.func.isRequired,
        onUpdateToken: React.PropTypes.func.isRequired,
        token: React.PropTypes.string,
        repo: React.PropTypes.string,
        pr: React.PropTypes.string,
    }

    getInitialState() {
        var initialState = {};
        initialState[KEY_TOKEN] = this.props.token;
        initialState[KEY_REPO] = this.props.repo;
        initialState[KEY_REQ] = this.props.pr;
        return initialState;
    }

    handleChange(event: any) {
        var newVal = event.target.value;
        var changeState = {};
        changeState[event.target.id] = newVal;
        this.setState(changeState);
        switch (event.target.id) {
            case KEY_TOKEN:
                this.props.onUpdateToken(newVal);
                break;
            default:
                break;
        }
    }

    onView() {
        this.props.onViewPullRequest(this.state[KEY_REPO], this.state[KEY_REQ]);
    }

    render() {
        return (
            <div>
                <input type="text" placeholder="access_token"
                    id={KEY_TOKEN} value={this.state[KEY_TOKEN]}
                    onChange={this.handleChange} />

                <div>
                    <input type="text" placeholder="owner/repo"
                        id={KEY_REPO} value={this.state[KEY_REPO]}
                        onChange={this.handleChange} />

                    <input type="text" placeholder="Pull Request #"
                        id={KEY_REQ} value={this.state[KEY_REQ]}
                        onChange={this.handleChange} />

                    <button onClick={this.onView}>View</button>
                    </div>
                </div>
        );
    }
}