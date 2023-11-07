import React, { useState, useEffect, useRef } from 'react'
import styles from './AddPipelineModal.module.css'
import { TextField, PrimaryButton, DatePicker } from '@fluentui/react';
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import { mergeStyles } from '@fluentui/react';
import { Editor } from 'react-draft-wysiwyg';
import { ContentState, EditorState, convertToRaw } from "draft-js";
import boldicon from "../../src/assets/boldicon.svg";
import undoicon from "../../src/assets/undoicon.svg";
import redoicon from "../../src/assets/redoicon.svg";
import { useLocation, useNavigate } from 'react-router-dom';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { axiosPrivateCall } from "../constants";
import { isEmpty, isNumOnly } from '../utils/validation';

// regex
const vendorRegex = /^[a-zA-Z0-9 @,.()-]*$/;

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
        errorMessage: {
            display: "none",
        },
        caretDownWrapper: { height: "22px", lineHeight: "20px !important" },
        dropdownItem: { minHeight: "10px", fontSize: 12 },
        dropdownItemSelected: { minHeight: "22px", fontSize: 12 },
    };
};

const calendarClass = (currentHover, error, value) => {
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

const textFieldColored = () => {
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
    { key: "InProgress", text: "Inrogress" },
    { key: "Done", text: "Done" },
    { key: "OnHold", text: "OnHold" },
    { key: "Closed", text: "Closed" },

]

const EditPipeline = () => {
    const navigate = useNavigate()
    const client_location = useLocation()
    const getclientData = client_location.state;
    const [validationErrors, setValidationErrors] = useState({});

    const [firstLoad, setFirstLoad] = useState(false);
    const [currentHover, setCurrentHover] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [clientData, setClientData] = useState({
        opportunity_id: '',
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

    const dateHandler = (date, name) => {
        setClientData((prevData) => {
            return {
                ...prevData,
                [name]: date,
            };
        });
        setCurrentHover("");
    };

    const dropDownHandler = (e, item, name, key) => {
        setClientData((prevState) => {
            let update = { ...prevState };
            update[name] = item.text;
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

    useEffect(() => {
        getData()
    }, [getclientData]);

    const validateFields = () => {
        const errors = {};
        if (!clientData.opportunity_type) {
            errors.opportunity_type = 'required';
        }

        if (!clientData.entry_date) {
            errors.entry_date = 'required';
        }

        if (!clientData.closure_date) {
            errors.closure_date = 'required';
        }

        if (!clientData.short_status) {
            errors.short_status = 'required';
        }

        if (!clientData.poc_source) {
            errors.poc_source = 'required';
        }

        if (!clientData.ss_sales) {
            errors.ss_sales = 'required';
        }

        if (!clientData.bu_lead) {
            errors.bu_lead = 'required';
        }

        if (!clientData.geo_location) {
            errors.geo_location = 'required';
        }

        if (!clientData.funnel_stage) {
            errors.funnel_stage = 'required';
        }

        if (!clientData.account_lead) {
            errors.account_lead = 'required';
        }

        if (!clientData.deal_$K) {
            errors.deal_$K = 'required';
        }

        if (!clientData.conf_adjust_deal) {
            errors.conf_adjust_deal = 'required';
        }

        if (!clientData.conf_percentage) {
            errors.conf_percentage = 'required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    useEffect(() => {
        setClientData((prevData) => {
            return {
                ...prevData,
                opportunity_description: draftToHtml(
                    convertToRaw(editorState.getCurrentContent())
                ),
                addtional_remarks: draftToHtml(
                    convertToRaw(editorState2.getCurrentContent())
                ),
            };
        });


    }, [editorState, editorState2]);

    useEffect(() => {
        if (firstLoad) {
            const jobHTML = clientData.opportunity_description;
            const additionalHTML = clientData.addtional_remarks;

            const contentBlock = htmlToDraft(jobHTML);
            const contentBlock2 = htmlToDraft(additionalHTML);

            const contentState = ContentState.createFromBlockArray(
                contentBlock.contentBlocks
            );
            const editorState = EditorState.createWithContent(contentState);

            const contentState2 = ContentState.createFromBlockArray(
                contentBlock2.contentBlocks
            );
            const editorState2 = EditorState.createWithContent(contentState2);

            setEditorState(EditorState.createWithContent(contentState));
            setEditorState2(EditorState.createWithContent(contentState2));

            setFirstLoad(false);
        }
    }, [firstLoad]);


    const submitHandler = async () => {
        const isValid = validateFields();
        if (isValid) {
            try {
                const response = await axiosPrivateCall.put(`/api/v1/crm/updateData/${getclientData._id}`, clientData);
                console.log(response.data);
                setErrorMsg('');

                setClientData(response.data,)

                navigate('/reports/managesalespipeline');
            } catch (error) {
                console.error("Error submitting data:", error);
                setErrorMsg("Error submitting data");
            }
        }
    }

    const getData = async () => {
        try {
            const response = await axiosPrivateCall.get(`/api/v1/crm/getclientbyid/${getclientData._id}`)

            setClientData(response.data)
            setFirstLoad(true);

        }
        catch (error) {
            console.log("data not found");
        }
    }

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
            setClientData({
                ...clientData,
                [inputName]: inputValue,
            });

        }

        setValidationErrors((prevErrors) => {
            return {
                ...prevErrors,
                [inputName]: '',
            };
        });
    }


    return (
        <div>
            <div className={styles.addcandidate_modal_header_container}>
                <div className={styles.header_tag_expand_close_icon_container}>
                    <div className={styles.header_tag_container}>
                        Sales Pipeline Sheet
                    </div>
                </div>
                <div className={styles.header_content_container}>
                    <div className={styles.header_content_title_container}>
                        <div className={styles.header_content_title_container}>
                            OPPORTUNITY ID :{clientData.opportunity_id}
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
                            <label className={styles.label_style}>Opportunity Type</label>
                            <Dropdown
                                onChange={(e, item) => {
                                    dropDownHandler(e, item, "opportunity_type");
                                    setCurrentHover("");
                                    setClientData({ ...clientData, opportunity_type: item.key });
                                }}
                                placeholder="Select"
                                options={opportunityTypeOptions}
                                selectedKey={clientData.opportunity_type}
                                notifyOnReselect
                                styles={dropDownStylesActive}
                                errorMessage={validationErrors.opportunity_type}
                            /></div>
                        <div className={styles.entry_date}> <label className={styles.label_style}>Entry Date</label>
                            <DatePicker

                                className={styles.myDatePicker}
                                styles={calendarClass}
                                placeholder="DD/MM/YYYY"
                                onSelectDate={(date) => dateHandler(date, 'entry_date')}
                                value={new Date(clientData.entry_date)}
                            />
                            {validationErrors.entry_date && (
                                <div className={styles.custom_error_message}>
                                    <span>{validationErrors.entry_date}</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.closure_date}> <label className={styles.label_style}>Closure Date</label>
                            <DatePicker

                                className={styles.myDatePicker}
                                styles={calendarClass}
                                placeholder="DD/MM/YYYY"
                                onSelectDate={(date) => dateHandler(date, 'closure_date')}
                                value={new Date(clientData.closure_date)}
                            />
                            {validationErrors.closure_date && (
                                <div className={styles.custom_error_message1}>
                                    <span>{validationErrors.closure_date}</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.short_status}> <label className={styles.label_style}>Short Status</label>
                            <Dropdown
                                onChange={(e, item) => {
                                    dropDownHandler(e, item, "short_status");
                                    setCurrentHover("");
                                    setClientData({ ...clientData, short_status: item.key });

                                }}
                                placeholder="Select"
                                options={shortStatusOptions}
                                selectedKey={clientData.short_status}
                                notifyOnReselect
                                styles={dropDownStylesActive}
                                errorMessage={validationErrors.short_status}
                            /></div>
                    </div>
                </div>
                <div className={styles.main_filter_options_container}>
                </div>
                <div className={styles.border}></div>
                <div className={styles.main_container1}>
                    <div className={styles.additional_information_container_edidpage}>
                        <div className={styles.addtional_information_title}>Additional Information</div>
                        <div className={styles.grid_container}>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>POC/Source</label>
                                <TextField
                                    value={clientData.poc_source}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "poc_source");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.poc_source} />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>SS Sales</label>
                                <TextField
                                    value={clientData.ss_sales}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "ss_sales");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.ss_sales} />

                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>BU Head</label>
                                <TextField
                                    value={clientData.bu_lead}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "bu_lead");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.bu_lead} />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>Geo Location</label>
                                <TextField
                                    value={clientData.geo_location}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "geo_location");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.geo_location}
                                />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>Account/Lead</label>
                                <TextField
                                    value={clientData.account_lead}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "account_lead");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.account_lead}
                                />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>Funnel Stage</label>
                                <Dropdown
                                    onChange={(e, item) => {
                                        dropDownHandler(e, item, "funnel_stage");
                                        setCurrentHover("");
                                        setClientData({ ...clientData, funnel_stage: item.key });
                                    }}
                                    placeholder="Select"
                                    options={funnelStageOptions}
                                    selectedKey={clientData.funnel_stage}
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
                                <label className={styles.add_info_label}>Deal $ K</label>
                                <TextField
                                    value={clientData.deal_$K}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "deal_$K");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.deal_$K}
                                />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>Conf., Adjust Deal</label>
                                <TextField
                                    value={clientData.conf_adjust_deal}
                                    onChange={(e) => {
                                        inputChangeHandler(e, "conf_adjust_deal");
                                        setCurrentHover("");
                                    }}
                                    styles={textFieldColored}
                                    errorMessage={validationErrors.conf_adjust_deal} />
                            </div>
                            <div className={styles.add_info}>
                                <label className={styles.add_info_label}>Conf., Percentage</label>
                                <TextField
                                    value={clientData.conf_percentage}
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
                                wrapperClassName={
                                    styles.editor_wrapper}
                                toolbar={editorToolbarOptions}
                                toolbarOnFocus
                                toolbarClassName={styles.editor_toolbar}
                                editorClassName={
                                    styles.editor_editor}
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
        </div>
    )
}
export default EditPipeline;







