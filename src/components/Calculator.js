import React from "react";
import './calculator.css';
import whdata from "../data/wormholedata";

const SITE_NAME = "Wormhole rolling calculator";

const options = [];
for (let i = 0; i < whdata.length; i++) {
    options.push(whdata[i]["Name"])
}

class Calculator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            locked: false,
            selected_wormhole: null,
            wormhole_selection_valid: false,
            hot_mass: 300000,
            hot_mass_valid: true,
            cold_mass: 200000,
            cold_mass_valid: true,
            wormhole_stage: "normal-mass",

            mass_upper_bound: 0,
            mass_lower_bound: 0,
            reduction_jumps: 1
        };
        this.handleStart = this.handleStart.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleWormholeSelect = this.handleWormholeSelect.bind(this);
        this.handleMassSelect = this.handleMassSelect.bind(this);
        this.handleStageSelect = this.handleStageSelect.bind(this);
        this.handleJump = this.handleJump.bind(this);
    }

    handleStart(event) {
        let upper_bound;
        let lower_bound;
        if (this.state.wormhole_stage === "normal-mass") {
            upper_bound = parseFloat(whdata[this.state.selected_wormhole]["Total Mass"]) * (1.1 / 1000);
            lower_bound = parseFloat(whdata[this.state.selected_wormhole]["Total Mass"]) * (0.45 / 1000);
        } else {
            upper_bound = parseFloat(whdata[this.state.selected_wormhole]["Total Mass"]) * (0.55 / 1000);
            lower_bound = parseFloat(whdata[this.state.selected_wormhole]["Total Mass"]) * (0.09 / 1000);
        }

        this.setState({
            locked: true,
            mass_upper_bound: upper_bound,
            mass_lower_bound: lower_bound
        })
    }

    handleReset(event) {
        this.setState({
            locked: false,
            mass_upper_bound: 0,
            mass_lower_bound: 0
        })
    }

    handleWormholeSelect(event) {
        let index = options.indexOf(event.target.value);
        if (index !== -1) {
            this.setState({
                selected_wormhole: index,
                wormhole_selection_valid: true
            })
        } else {
            this.setState({
                selected_wormhole: null,
                wormhole_selection_valid: false
            })
        }
    }

    handleMassSelect(event) {
        let massTonnes = parseFloat(event.target.value);
        if (!isNaN(massTonnes) && massTonnes > 0) {
            this.setState({
                [event.target.id]: massTonnes,
                [event.target.id + "_valid"]: true
            })
        } else {
            this.setState({
                [event.target.id + "_valid"]: false
            })
        }
    }

    handleStageSelect(event) {
        this.setState({
            wormhole_stage: event.target.id
        })
    }

    handlePositionSelect(event) {
        this.setState({
            ship_position: event.target.id
        })
    }

    handleJump(event) {
        let jumped_mass;
        if (event.target.id === "jump-done-c") {
            jumped_mass = this.state.cold_mass;
        } else if (event.target.id === "jump-done-h") {
            jumped_mass = this.state.hot_mass;
        } else {
            console.error("Invalid jump event " + event.target.id)
            return;
        }

        let new_size;
        if (this.state.wormhole_stage === "normal-mass") {
            new_size = "reduced-mass";
        } else if (this.state.wormhole_stage === "reduced-mass") {
            new_size = "crit-mass"
        }

        this.setState({
            mass_upper_bound: this.state.mass_lower_bound,
            mass_lower_bound: Math.max(this.state.mass_lower_bound - jumped_mass, 0),
            wormhole_stage: new_size,
            ship_position: this.state.ship_position === "in-target" ? "out-target" : "in-target",
        })
    }

    render() {
        let all_valid = this.state.wormhole_selection_valid
            && this.state.hot_mass_valid
            && this.state.cold_mass_valid
            && (this.state.hot_mass >= this.state.cold_mass);

        let calculation = [];
        if (all_valid && this.state.locked) {
            calculation.push(
                <div key="mass-bounds" className="info-bar">
                    <span>Upper mass bound: {this.state.mass_upper_bound.toLocaleString()} tonnes</span><span>Lower mass bound: {this.state.mass_lower_bound.toLocaleString()} tonnes</span>
                </div>
            )

            calculation.push(
                <div key="new-pass" className="info-bar">
                    <div className="info-group">
                        <span>{Math.floor(this.state.mass_upper_bound / this.state.hot_mass).toLocaleString()} passes 'hot'</span>
                        <b>|</b>
                        <span>{Math.floor(this.state.mass_upper_bound / this.state.cold_mass).toLocaleString()} passes 'cold'</span>
                    </div>
                    <div className="info-group">
                        <span>{Math.floor(this.state.mass_lower_bound / this.state.hot_mass).toLocaleString()} passes 'hot'</span>
                        <b>|</b>
                        <span>{Math.floor(this.state.mass_lower_bound / this.state.cold_mass).toLocaleString()} passes 'cold'</span>
                    </div>
                </div>
            )
            if (Math.floor(this.state.mass_lower_bound / this.state.hot_mass) >= 1) {
                calculation.push(
                    <div key="reduction-form" className="info-bar">
                        <div className="info-group">
                            <span>Reduced after</span>
                            <input
                                type="number"
                                id="reduction_jumps"
                                title="Ship jumps until reduction"
                                placeholder="Jumps to reduction"
                                defaultValue="1"
                                className="selectable"
                                onChange={(e) => this.setState({"reduction_jumps": e.target.value})}
                            />
                            <span>jumps</span>
                        </div>
                        <button
                            id="jump-done-h"
                            className="selectable warn"
                            onClick={this.handleJump}
                        >
                            Confirm
                        </button>
                    </div>
                )
            } else if (this.state.mass_lower_bound / this.state.cold_mass >= 1) {
                calculation.push(
                    <div key="reduction-form" className="info-bar">
                        <span>Reduced after</span>
                        <input
                            type="number"
                            id="reduction_jumps"
                            title="Ship jumps until reduction"
                            placeholder="Jumps to reduction"
                            defaultValue="1"
                            className="selectable"
                            onChange={(e) => this.setState({"reduction_jumps": e.target.value})}
                        />
                        <span>jumps</span>
                        <button
                            id="jump-done-c"
                            className="selectable warn"
                            onClick={this.handleJump}
                        >
                            Confirm
                        </button>
                    </div>
                )
            } else {    // Ship mass greater than lower bound
                calculation.push(
                    <div key="new-pass" className="info-bar danger">
                        <span>DANGER: Lower bound on wormhole mass ({this.state.mass_lower_bound.toLocaleString()} tonnes) is below ship mass ({this.state.cold_mass.toLocaleString()} tonnes)<br/>The hole may roll on the next jump, and lock you out</span>
                    </div>
                )
            }
        }

        let wormholeInfo;
        if (!this.state.wormhole_selection_valid) {
            wormholeInfo = <span id="wormhole-id">No wormhole selected</span>
        } else {
            wormholeInfo = <>
                <span><b>{"Wormhole " + whdata[this.state.selected_wormhole]["Name"]}</b></span>
                <span>{whdata[this.state.selected_wormhole]["Origin"] + " ↔ " + whdata[this.state.selected_wormhole]["Destination"]}</span>
            </>
        }
        let errorBars = [];
        if (this.state.selected_wormhole !== null && !this.state.locked) {
            if (parseFloat(whdata[this.state.selected_wormhole]["Mass Regeneration"]) > 0.0) {
                errorBars.push(
                    <div key="regenerate-error" className="info-bar danger">
                        <span/><span>Error: This wormhole regenerates mass and cannot be rolled</span><span/>
                    </div>
                );
            }
            if (parseFloat(whdata[this.state.selected_wormhole]["Jump Mass"]) / 1000 < this.state.cold_mass) {
                errorBars.push(
                    <div key="shiptoobig-error" className="info-bar danger">
                        <span/><span>Error: This wormhole does not permit the rolling ship to transit (Mass limit: {(parseFloat(whdata[this.state.selected_wormhole]["Jump Mass"]) / 1000).toLocaleString()} tonnes)</span><span/>
                    </div>
                );
            } else if (parseFloat(whdata[this.state.selected_wormhole]["Jump Mass"]) / 1000 < this.state.hot_mass) {
                errorBars.push(
                    <div key="shiptoobig-hot-error" className="info-bar warn">
                        <span/><span>Warning: This wormhole does not permit the rolling ship to transit 'hot' (Mass limit: {(parseFloat(whdata[this.state.selected_wormhole]["Jump Mass"]) / 1000).toLocaleString()} tonnes)</span><span/>
                    </div>
                );
            }
            if (this.state.wormhole_stage === "crit-mass") {
                errorBars.push(
                    <div key="crit-error" className="info-bar danger">
                        <span/>
                        <span>
                            Danger: This wormhole cannot be safely rolled and has at most {
                            (parseFloat(whdata[this.state.selected_wormhole]["Total Mass"]) * (0.11 / 1000)).toLocaleString()  // 1000 to convert kg to tonnes, then max 'critical' mass is 11% of total mass
                        } tonnes left <br/> (Jump limit: {(parseFloat(whdata[this.state.selected_wormhole]["Jump Mass"]) / 1000).toLocaleString()} tonnes)
                        </span>
                        <span/>
                    </div>
                );
            }
        }
        if (this.state.hot_mass < this.state.cold_mass) {
            errorBars.push(
                <div key="invalidmass-error" className="info-bar danger">
                    <span/><span>Error: Cold mass must be smaller or equal to hot mass</span><span/>
                </div>
            );
        }

        let inputSelectable = this.state.locked ? "input-locked" : "selectable";

        return <>
            <div className="calculator">
                <div id="title-bar" className="info-bar"><b>Wormhole rolling calculator</b></div>
                <div id="wormhole-bar" className="info-bar">
                    {wormholeInfo}
                    {
                        this.state.locked ?
                            <>
                                <button
                                    id="reset"
                                    className="warn selectable"
                                    onClick={this.handleReset}
                                >
                                    Reset
                                </button>
                            </> :
                            <>
                                <input
                                    id="wormhole-select"
                                    title="Select wormhole to roll"
                                    placeholder="Select wormhole"
                                    list="wormholes"
                                    size="15"
                                    onChange={this.handleWormholeSelect}
                                    className={this.state.wormhole_selection_valid ? "selectable" : "danger"}
                                />
                                <datalist id="wormholes">
                                    {
                                        options.map((option, index) => <option key={index} value={option}></option>)
                                    }
                                </datalist>
                            </>
                    }
                </div>
                <div id="status-bar" className="info-bar">
                    <button
                        id="normal-mass"
                        className={this.state.wormhole_stage === "normal-mass" ? "okay" : inputSelectable}
                        disabled={this.state.locked}
                        onClick={this.handleStageSelect}
                    >
                        Not yet reduced
                    </button>
                    <button
                        id="reduced-mass"
                        className={this.state.wormhole_stage === "reduced-mass" ? "warn" : inputSelectable}
                        disabled={this.state.locked}
                        onClick={this.handleStageSelect}
                    >
                        Stability reduced
                    </button>
                    <button
                        id="crit-mass"
                        className={this.state.wormhole_stage === "crit-mass" ? "danger" : inputSelectable}
                        disabled={this.state.locked}
                        onClick={this.handleStageSelect}
                    >
                        Critically Disrupted
                    </button>
                </div>
                <div id="mass-bar" className="info-bar">
                    <label>'Cold' mass (tonnes)
                        <input
                            type="number"
                            id="cold_mass"
                            title="'Cold' mass of rolling ship"
                            placeholder="'Cold' mass"
                            defaultValue={this.state.cold_mass}
                            onChange={this.handleMassSelect}
                            className={this.state.cold_mass_valid ? inputSelectable : "danger"}
                            disabled={this.state.locked}
                        />
                    </label>
                    <label>'Hot' mass (tonnes)
                        <input
                            type="number"
                            id="hot_mass"
                            title="'Hot' mass of rolling ship"
                            placeholder="'Hot' mass"
                            defaultValue={this.state.hot_mass}
                            onChange={this.handleMassSelect}
                            className={this.state.hot_mass_valid ? inputSelectable : "danger"}
                            disabled={this.state.locked}
                        />
                    </label>
                </div>
                {errorBars}
                {
                    all_valid && !this.state.locked && errorBars.length === 0 ? <>
                        <div id="start-bar" className="bar okay" onClick={this.handleStart}>
                            <span/><b>Start</b><span/>
                        </div>
                    </> : <></>
                }
                {
                    all_valid && this.state.locked ? calculation : <></>
                }
                <div id="glossary-spacer"></div>
                <div id="glossary-header">
                    <b>⬇</b> Glossary <b>⬇</b>
                </div>
            </div>
            <div id="glossary" className="info-bar">
                <ul>
                    <li>"Rolling"<br/>&emsp;Intentionally collapsing a wormhole by passing large-mass ships through it</li>
                    <li>"Hot"<br/>&emsp;Spaceship with all mass-increasing modules turned on (Afterburner, Microwarpdrive, etc)</li>
                    <li>"Cold"<br/>&emsp;Spaceship with all mass-increasing modules turned off</li>
                    <li>"Reduced"<br/>&emsp;Spaceship with all mass-increasing modules turned off</li>
                    <li>"Crit/Critically reduced"<br/>&emsp;Spaceship with all mass-increasing modules turned off</li>
                </ul>
            </div>
            <div id="copyright-notice" className="info-bar">
                    <b>Copyright notice</b><br/>
                    <i>
                        EVE Online and the EVE logo are the registered trademarks of CCP hf.
                        All rights are reserved worldwide.
                        All other trademarks are the property of their respective owners.
                        EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf.
                        All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf.
                        CCP hf. has granted permission to '{SITE_NAME}' to use EVE Online and all associated logos and designs for promotional and information purposes on its website but does not endorse, and is not in any way affiliated with, '{SITE_NAME}'.
                        CCP is in no way responsible for the content on or functioning of this website, nor can it be liable for any damage arising from the use of this website.
                    </i>
            </div>
        </>;
    }
}

export default Calculator;