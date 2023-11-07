import React, { useState, useEffect, useCallback } from 'react'
import { Label, Modal } from '@fluentui/react'
import styles from './AddPipelineModal.module.css'
import { Icon } from '@fluentui/react/lib/Icon';
import { TextField, PrimaryButton, DefaultButton, DatePicker } from '@fluentui/react';
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import { mergeStyles, mergeStyleSets } from '@fluentui/react';
import { Editor } from 'react-draft-wysiwyg';
import boldicon from "../../src/assets/boldicon.svg";
import undoicon from "../../src/assets/undoicon.svg";
import redoicon from "../../src/assets/redoicon.svg";
import { Popup } from "../components/Popup";
import { useNavigate } from 'react-router-dom';
import draftToHtml from "draftjs-to-html";
import { EditorState, convertToRaw } from "draft-js";
import { isEmpty, isNumOnly } from '../utils/validation';
import { axiosPrivateCall } from "../constants";

// regex
const vendorRegex = /^[a-zA-Z0-9 @,.()-]*$/;

const contractIconClass = mergeStyles({
    fontSize: 20,
    height: '20px',
    width: '20px',
    cursor: 'pointer',
});

const closeIconClass = mergeStyles({
    fontSize: 16,
    height: '20px',
    width: '20px',
    cursor: 'pointer'

});

const dropDownStylesActive = (props, currentHover, error, value) => {
    return {
        dropdown: {
            width: "150px",
            minWidth: "120px",
            minHeight: "20px",
        },
        title: {
            height: "22px",
            lineHeight: "18px",
            fontSize: "12px",
            borderColor: error
                ? "#a80000"
                : currentHover === value
                    ? "rgb(96, 94, 92)"
                    : "transparent",
        },

        caretDownWrapper: { height: "22px", lineHeight: "20px !important" },
        dropdownItem: { minHeight: "15px", fontSize: 12 },
        dropdownItemSelected: { minHeight: "22px", fontSize: 12 },
    };
};

const calendarClass = (props, currentHover, error, value) => {
    return {
        root: {
            "*": {
                width: "110%",
                fontSize: "12px !important",
                height: "22px !important",
                lineHeight: "20px !important",
                borderColor: error
                    ? "rgb(168,0,0)"
                    : currentHover === value
                        ? "rgb(50, 49, 48) !important "
                        : "transparent !important",
                selectors: {
                    ":hover": {
                        borderColor: "rgb(50, 49, 48) !important",
                    },
                },
            },
        },

        icon: { height: 10, width: 10, left: "85%", padding: "0px 0px" },
    };
};

const textFieldColored = (props, currentHover, error, value) => {
    return {
        fieldGroup: {
            width: "150px",
            height: "22px",
            backgroundColor: "#FFFFFF",
            selectors: {
                ":focus": {
                    borderColor: "rgb(96, 94, 92)",
                },
            },
        },
        field: {
            fontSize: 12,
        },
    };
};

const opportunityTypeOptions = [
    { key: "Consulting", text: "Consulting" },
    { key: "Project FB", text: "Project FB" },
    { key: "Project TM", text: "Project TM" },
    { key: "Managed Staffing", text: "Managed Staffing" },
    { key: "Staffing", text: "Staffing" },
];
const funnelStageOptions = [
    { key: "Prospect", text: "Prospect" },
    { key: "Lead", text: "Lead" },
    { key: "Presales", text: "Presales" },
    { key: "Bid", text: "Bid" },
    { key: "Sales", text: "Sales" },
    { key: "Closure", text: "Closure" },
    { key: "Negotiation", text: "Negotiation" },
    { key: "Won", text: "Won" },
    { key: "Lost", text: "Lost" },
    { key: "On Hold", text: "On Hold" },
    { key: "N/A", text: "N/A" },

];
const shortStatusOptions = [
    { key: "Open", text: "Open" },
    { key: "In-progress", text: "In-progress" },
    { key: "Done", text: "Done" },
    { key: "OnHold", text: "OnHold" },
    { key: "Closed", text: "Closed" }
]


const AddPipeline = (props) => {
    const navigate = useNavigate()
    const { isModalOpen, setIsModalOpen, showMessageBar, setShowMessageBar } = props;
    const [showPopup, setShowPopup] = useState(false);
    const [isModalShrunk, setIsModalShrunk] = useState(false);
    const [currentHover, setCurrentHover] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [pipelineData, setPipelineData] = useState({
        account_lead: '',
        opportunity_type: '',
        opportunity_description: '',
        geo_location: '',
        deal_$K: '',
        conf_percentage: '',
        conf_adjust_deal: '',
        funnel_stage: '',
        closure_date: '',
        entry_date: '',
        short_status: '',
        poc_source: '',
        ss_sales: '',
        bu_lead: '',
        addtional_remarks: ''
    })

    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );

    const [editorState2, setEditorState2] = useState(() =>
        EditorState.createEmpty()
    );

    let minDate = new Date();

    const dateHandler = (date, name) => {
        setPipelineData((prevData) => {
            return {
                ...prevData,
                [name]: date,
            };
        });
        setCurrentHover("");
        setValidationErrors((prevErrors) => {
            return {
                ...prevErrors,
                [name]: '',
            };
        });
    };

    const modalSizeHandler = () => {
        setIsModalShrunk(!isModalShrunk)
    }

    const dropDownHandler = (e, item, name) => {
        setPipelineData((prevData) => {
            return {
                ...prevData,
                [name]: item.text,
            };
        });
        setValidationErrors((prevErrors) => {
            return {
                ...prevErrors,
                [name]: '',
            };
        });

    };
    const editorToolbarOptions = {
        options: ["inline", "list", "link", "history"],
        inline: {
            bold: { icon: boldicon, className: undefined },
            options: ["bold", "italic", "underline"],
        },
        list: {
            options: ["unordered", "ordered"],
        },
        link: {
            options: ["link"],
        },
        history: {
            options: ["undo", "redo"],
            undo: { icon: undoicon },
            redo: { icon: redoicon },
        },

    };
    const validateFields = () => {
        const errors = {};

        if (!pipelineData.opportunity_type) {
            errors.opportunity_type = 'required';
        }

        if (!pipelineData.entry_date) {
            errors.entry_date = 'required';
        }

        if (!pipelineData.closure_date) {
            errors.closure_date = 'required';
        }


        if (!pipelineData.short_status) {
            errors.short_status = 'required';
        }

        if (!pipelineData.poc_source) {
            errors.poc_source = 'required';
        }

        if (!pipelineData.ss_sales) {
            errors.ss_sales = 'required';
        }

        if (!pipelineData.bu_lead) {
            errors.bu_lead = 'required';
        }

        if (!pipelineData.geo_location) {
            errors.geo_location = 'required';
        }

        if (!pipelineData.funnel_stage) {
            errors.funnel_stage = 'required';
        }

        if (!pipelineData.account_lead) {
            errors.account_lead = 'required';
        }

        if (!pipelineData.deal_$K) {
            errors.deal_$K = 'required';
        }

        if (!pipelineData.conf_adjust_deal) {
            errors.conf_adjust_deal = 'required';
        }

        if (!pipelineData.conf_percentage) {
            errors.conf_percentage = 'required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        setPipelineData((prevData) => {
            return {
                ...prevData,
                opportunity_description: draftToHtml(convertToRaw(editorState.getCurrentContent())),
                addtional_remarks: draftToHtml(convertToRaw(editorState2.getCurrentContent())),
            };
        });
    }, [editorState, editorState2]);

    const submitHandler = async () => {
        const isValid = validateFields();

        if (isValid) {
            try {
                axiosPrivateCall.post("/api/v1/crm/addnew", pipelineData)

                    .then((response) => {
                        setErrorMsg('');
                        setPipelineData(response.data);
                        setIsModalOpen(!isModalOpen);
                        setShowMessageBar(!showMessageBar);
                    })
            } catch (error) {
                console.error("Error submitting data:", error);
                setErrorMsg("Error submitting data");
            }
        }
    };

    const inputChangeHandler = (e, inputName) => {
        e.preventDefault();
        const { value } = e.target;
        let inputValue = value;
        let isInputValid = true;

        if (inputName === "poc_source") {
            isInputValid = vendorRegex.test(value);
        }

        if (inputName === "ss_sales") {
            isInputValid = vendorRegex.test(value);
        }

        if (inputName === "bu_lead") {
            isInputValid = vendorRegex.test(value);
        }

        if (inputName === "geo_location") {
            isInputValid = vendorRegex.test(value);
        }

        if (inputName === "account_lead") {
            isInputValid = vendorRegex.test(value);
        }

        if (inputName === "deal_$K") {
            if (!isNumOnly(value)) {
                isInputValid = false;
            }
            if (isEmpty(value)) {
                isInputValid = true;
            }
        }
        if (inputName === "conf_adjust_deal") {

            if (!isNumOnly(value)) {
                isInputValid = false;
            }
            if (isEmpty(value)) {
                isInputValid = true;
            }
        }
        if (inputName === "conf_percentage") {

            if (!isNumOnly(value)) {
                isInputValid = false;
            }
            if (isEmpty(value)) {
                isInputValid = true;
            }
        }

        if (inputName === "addtional_remarks") {
            isInputValid = vendorRegex.test(value);
        }

        if (isInputValid) {
            setPipelineData({
                ...pipelineData,
                [inputName]: inputValue,
            });

            setValidationErrors((prevErrors) => {
                return {
                    ...prevErrors,
                    [inputName]: '',
                };
            });
        }
    };


    return (
        <div>
            {
                <Popup
                    resetState={() => ""}
                    showPopup={showPopup}
                    setShowPopup={setShowPopup}
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                />
            }
            <Modal scrollableContentClassName={styles.addcandidate_modal_scrollable_content} containerClassName={`${isModalShrunk ? styles.addcandidate_modal_container_shrunk : styles.addcandidate_modal_container}`}
                isOpen={isModalOpen}>
                <div className={styles.addcandidate_modal_header_container}>
                    <div className={styles.header_tag_expand_close_icon_container}>

                        <div className={styles.header_tag_container}>
                            Sales Pipeline Sheet
                        </div>
                        <div className={styles.header_expand_close_icon_container}>
                            <div onClick={modalSizeHandler} className={styles.header_expand_icon_container}>
                                {isModalShrunk ? <Icon iconName='FullScreen' className={contractIconClass} /> :
                                    <Icon iconName='BackToWindow' className={contractIconClass} />}
                            </div>
                            <div onClick={() => setShowPopup(!showPopup)} className={styles.header_close_icon_container}>
                                <Icon iconName='ChromeClose' className={closeIconClass} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.header_content_container}>
                        <div className={styles.header_content_title_container}>
                            <div className={styles.header_content_title_container}>
                                OPPORTUNITY ID :
                            </div>
                        </div>
                        <div className={styles.header_content_save_container}>
                            <div className={styles.header_save_close_btns_container}>
                                <PrimaryButton text={`Save & Close`}
                                    onClick={submitHandler}
                                    iconProps={{ iconName: "Save" }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.add_modal_main_container}>
                    <div className={styles.border}></div>
                    <div className={styles.modal_main_container}>
                        <div className={styles.sub_container}>
                            <div className={styles.opportunity_type}>
                                <Label className={styles.label_style} required>Opportunity Type</Label>
                                <Dropdown
                                    onChange={(e, item) => {
                                        dropDownHandler(e, item, "opportunity_type");
                                        setCurrentHover("");
                                        setPipelineData({ ...pipelineData, opportunity_type: item.key });
                                    }}
                                    placeholder="Select"
                                    options={opportunityTypeOptions}
                                    selectedKey={pipelineData.opportunity_type}
                                    notifyOnReselect
                                    styles={dropDownStylesActive}
                                    errorMessage={validationErrors.opportunity_type}
                                />
                            </div>
                            <div className={styles.entry_date}>
                                <Label className={styles.label_style} required>Entry Date</Label>
                                <DatePicker
                                    minDate={minDate}
                                    className={styles.myDatePicker}
                                    styles={calendarClass}
                                    placeholder="DD/MM/YYYY"
                                    onSelectDate={(date) => dateHandler(date, 'entry_date')}
                                    value={pipelineData.entry_date}
                                />
                                {validationErrors.entry_date && (
                                    <div className={styles.custom_error_message}>
                                        <span>{validationErrors.entry_date}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.closure_date}>
                                <Label className={styles.label_style} required>Closure Date</Label>
                                <DatePicker
                                    minDate={minDate}
                                    className={styles.myDatePicker}
                                    styles={calendarClass}
                                    placeholder="DD/MM/YYYY"
                                    onSelectDate={(date) => dateHandler(date, 'closure_date')}
                                    value={pipelineData.closure_date}
                                    errorMessage={validationErrors.closure_date}
                                />
                                {validationErrors.closure_date && (
                                    <div className={styles.custom_error_message1}>
                                        <span>{validationErrors.closure_date}</span>
                                    </div>
                                )}</div>
                            <div className={styles.short_status}>
                                <Label className={styles.label_style} required>Short Status</Label>
                                <Dropdown
                                    onChange={(e, item) => {
                                        dropDownHandler(e, item, "short_status");
                                        setCurrentHover("");
                                        setPipelineData({ ...pipelineData, short_status: item.key });
                                    }}
                                    placeholder="Select"
                                    options={shortStatusOptions}
                                    selectedKey={pipelineData.short_status}
                                    notifyOnReselect
                                    styles={dropDownStylesActive}
                                    errorMessage={validationErrors.short_status}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.main_filter_options_container}>
                    </div>
                    <div className={styles.border}></div>
                    <div className={styles.main_container1}>
                        <div className={styles.additional_information_container}>
                            <div className={styles.addtional_information_title}>Additional Information</div>
                            <div className={styles.grid_container}>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>POC/Source</Label>
                                    <TextField
                                        value={pipelineData.poc_source}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "poc_source");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.poc_source} />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>SS Sales</Label>
                                    <TextField
                                        value={pipelineData.ss_sales}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "ss_sales");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.ss_sales} />

                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>BU Head</Label>
                                    <TextField
                                        value={pipelineData.bu_lead}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "bu_lead");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.bu_lead} />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Geo Location</Label>
                                    <TextField
                                        value={pipelineData.geo_location}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "geo_location");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.geo_location}
                                    />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Account/Lead</Label>
                                    <TextField
                                        value={pipelineData.account_lead}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "account_lead");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.account_lead}
                                    />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Funnel Stage</Label>
                                    <Dropdown
                                        onChange={(e, item) => {
                                            dropDownHandler(e, item, "funnel_stage");
                                            setCurrentHover("");
                                            setPipelineData({ ...pipelineData, funnel_stage: item.key });

                                        }}
                                        placeholder="Select"
                                        options={funnelStageOptions}
                                        selectedKey={pipelineData.funnel_stage}
                                        notifyOnReselect
                                        styles={dropDownStylesActive}
                                        errorMessage={validationErrors.funnel_stage}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.pricing_details_container}>
                            <div className={styles.pricing_details_title}>Pricing Details</div>
                            <div className={styles.grid_container}>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Deal $ K</Label>
                                    <TextField
                                        value={pipelineData.deal_$K}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "deal_$K");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}

                                        errorMessage={validationErrors.deal_$K}
                                    />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Conf., Adjust Deal</Label>
                                    <TextField
                                        value={pipelineData.conf_adjust_deal}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "conf_adjust_deal");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}

                                        errorMessage={validationErrors.conf_adjust_deal} />
                                </div>
                                <div className={styles.add_info}>
                                    <Label className={styles.add_info_label} required>Conf., Percentage</Label>
                                    <TextField
                                        value={pipelineData.conf_percentage}
                                        onChange={(e) => {
                                            inputChangeHandler(e, "conf_percentage");
                                            setCurrentHover("");
                                        }}
                                        styles={textFieldColored}
                                        errorMessage={validationErrors.conf_percentage} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.main_container}>
                        <div className={styles.opportunity_description_container}>
                            <div className={styles.opportunity_description_title}>Opportunity Description</div>
                            <div className={styles.oppurtunity_description}>
                                <Editor
                                    wrapperClassName={styles.editor_wrapper}
                                    toolbar={editorToolbarOptions}
                                    toolbarOnFocus
                                    toolbarClassName={styles.editor_toolbar}
                                    editorClassName={styles.editor_editor}
                                    placeholder="Click to opportunity description"
                                    editorState={editorState}
                                    onEditorStateChange={(editorState) =>
                                        setEditorState(editorState)
                                    }
                                />
                            </div>
                        </div>
                        <div className={styles.additional_remarks_container}>
                            <div className={styles.additional_remarks_title}>Additional Remarks</div>
                            <div className={styles.additional_remarks}>

                                <Editor
                                    wrapperClassName={styles.editor_wrapper}
                                    toolbar={editorToolbarOptions}
                                    toolbarOnFocus
                                    toolbarClassName={styles.editor_toolbar}
                                    editorClassName={styles.editor_editor}
                                    placeholder="Click to add Remarks"
                                    editorState={editorState2}
                                    onEditorStateChange={(editorState2) =>
                                        setEditorState2(editorState2)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
export default AddPipeline;







