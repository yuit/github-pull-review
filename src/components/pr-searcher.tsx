import * as React from "react"

interface Controller {
    guessPr(e: Event): void;
}

interface PrSearcherState {
    error: any;
}

interface PrSearcherProp {
    controller: {
        guessPr(e: Event): {
            getRepo(): string;
            getId(): string;
        };
    };
    history: {
        pushState(p1: any, str: string);
    };
    onUpdateToken(value: any): void;
}

class PrSearcher extends React.Component<PrSearcherProp, PrSearcherState> {
    constructor(props) {
        super(props);
        this.state = {
            error: ""
        }
    }

    propTypes: {
        controller: React.PropTypes.any.isRequired
    }

    lookupPr(event) {
        if (event.charCode === /*Enter*/13) {
            var pr = this.props.controller.guessPr(event.target.value);
            if (pr) {
                this.props.history.pushState(null, `/repos/${pr.getRepo()}/${pr.getId()}/history`);
            }
            else {
                this.setState({ error: "Could not find PR" });
            }
        }
    }

    handleChange (event) {
        var newVal = event.target.value;
        var changeState: any = {};
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

    render() {
        let errorComponent: React.HTMLProps<HTMLDivElement>;
        if (this.state.error) {
            errorComponent = <div>{ this.state.error } </div>;
        }

        return (
            <div>
            Look up a PR: <input type="text" onKeyPress= { this.lookupPr } />
                { errorComponent }
            </div>
        );
    }
}