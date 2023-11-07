import React, { useState, useEffect, useCallback } from "react";
import {
  PrimaryButton,
  DefaultButton,
  TextField,
  FontIcon,
  mergeStyles,
  mergeStyleSets,
  Dropdown,
  Label,
  DatePicker,
} from "@fluentui/react";
import { axiosPrivateCall } from "../constants";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ContentState,
  EditorState,
  convertFromHTML,
  convertToRaw,
} from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
// import 'draft-js/dist/Draft.css';
import "../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "./DraftEditorResetFix.css";
import { Modal } from "@fluentui/react";
import { Icon } from "@fluentui/react/lib/Icon";

import styles from "./TrackSubmission.module.css";
import thumbsdowngrey from "../assets/thumbsdowngrey.svg";
import thumbsupwhite from "../assets/thumbsupwhite.svg";
import thumbsdownwhite from "../assets/thumbsdownwhite.svg";

//icons
import boldicon from "../../src/assets/boldicon.svg";
import undoicon from "../../src/assets/undoicon.svg";
import redoicon from "../../src/assets/redoicon.svg";

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
  // fontFamily: {
  //   options: ['Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
  // },
};
const calendarClass = (props, currentHover, error, value) => {
	return {
	  root: {
		"*": {
		  width: "100%",
		  fontSize: "12px !important",
		  height: "22px !important",
		  lineHeight: "20px !important",
		  borderColor: error
			? "#a80000"
			: currentHover === value
			? "#a80000"
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

const iconClass = mergeStyles({
  fontSize: 20,
  height: 20,
  width: 20,
  margin: "0 30px",
  marginTop: "10px",
  color: "#999DA0",
  cursor: "pointer",
});

const submissionStatusOptions = [
  { key: "initial_screening_select", text: "Initial Screening Select" },
  { key: "initial_screening_reject", text: "Initial Screening Reject" },
  { key: "level_1_select", text: "Level 1 Select" },
  { key: "level_1_reject", text: "Level 1 Reject" },
  { key: "level_2_select", text: "Level 2 Select" },
  { key: "level_2_reject", text: "Level 2 Reject" },
  { key: "final_select", text: "Final Select" },
  { key: "final_reject", text: "Final Reject" },
  { key: "offer_accept", text: "Offer Accept" }, // Added new option
  { key: "offer_denied", text: "Offer Denied" }, // Added new option
  { key: "onboard_select", text: "Onboard Select" },
  { key: "onboard_reject", text: "Onboard Reject" },
  { key: "bg_verification_select", text: "BG Verification Select" },
  { key: "bg_verification_reject", text: "BG Verification Reject" },
];

const textFieldStyle = (props, currentHover, error, value) => {
  return {
    fieldGroup: {
      width: "160px",
      height: "22px",
      // backgroundColor: '#EDF2F6',
      borderColor: "transparent",
    },
    field: {
      fontSize: 12,
    },
  };
};

const textFieldColored = (props, currentHover, error, value) => {
  return {
    fieldGroup: {
      width: "160px",
      height: "22px",
      // backgroundColor: "#EDF2F6",
      borderColor: error ? "#a80000" : "transparent",
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

const dropDownStyles = (props, currentHover, error, value) => {
  return {
    dropdown: { width: "160px", minWidth: "160px", minHeight: "20px" },
    title: {
      height: "22px",
      lineHeight: "18px",
      fontSize: "12px",
      borderColor: currentHover === value ? "rgb(96, 94, 92)" : "transparent",
    },
    caretDownWrapper: { height: "22px", lineHeight: "20px !important" },
    dropdownItem: { minHeight: "22px", fontSize: 12 },
    dropdownItemSelected: { minHeight: "22px", fontSize: 12 },
  };
};

const initialState = {
  _id: "",
  submission_id: "",
  candidate_id: "",
  demand_id: "",
  status: "",
  failed: "",
  remarks: [],
  offeredCtc: "",
  billingRate: "",
  join_date: "",
};

let remarksArr = [
  {
    status: "initial_screening",
    remark: "",
    failed: "",
  },
  {
    status: "level_1",
    remark: "",
    failed: "",
  },
  {
    status: "level_2",
    remark: "",
    failed: "",
  },
  {
    status: "final_select",
    remark: "",
    failed: "",
  },
  {
    status: "offered",
    remark: "",
    failed: "",
  },
  {
    status: "onboard",
    remark: "",
    failed: "",
  },
  {
    status: "bg_verification",
    remark: "",
    failed: "",
  },
];

const TrackSubmission = () => {
  const navigateTo = useNavigate();

  const [candidateId, setCandidateId] = useState("");
  const [demandId, setDemandId] = useState("");
  const [submissionId, setSubmissionId] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const [currentHover, setCurrentHover] = useState("");

  const [currentLevel, setCurrentLevel] = useState(0);

  const [rejectionLevel, setRejectionLevel] = useState("");

  const [errors, setErrors] = useState({
    ...initialState,
    join_date:"",
    offeredCtc:"",
    billingRate:"",
  });
  useEffect(() => {
    // Set the initial value of `rejectionLevel` here
    setRejectionLevel();
  }, []);
  console.log(rejectionLevel, "re");
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createEmpty()
  );

  const [submissionData, setSubmissionData] = useState({ ...initialState });
  console.log(submissionData, "skjsj");
  const [presubmissionData, setPreSubmissionData] = useState({
	  ...initialState,
	});
  const sanitize = (obj) => {
    const sanitizedData = {};

    Object.keys(initialState).map((key) => {
      if (key === "remarks") {
        if (obj[key].length === 0) {
          sanitizedData[key] = remarksArr;
        } else sanitizedData[key] = obj[key];
      } else sanitizedData[key] = obj[key];
    });

    return sanitizedData;
  };

  const getSubmissionTrackingDetails = () => {
    console.log("firi", searchParams);

    axiosPrivateCall
      .get(
        `/api/v1/submission/getSubmissionTracker?submission_id=${searchParams.get(
          "submission_id"
        )}`
      )
      .then((res) => {
        console.log(res);
        const sanitizedData = sanitize(res.data);
        checkRejectionLevel(sanitizedData.status);
        console.log(res.data);
        setSubmissionData(sanitizedData);
        setSubmissionId(res.data.SubmissionId);
        setCandidateId(res.data.candidate_id.CandidateId);
        setDemandId(res.data.demand_id.DemandId);

        setPreSubmissionData(sanitizedData);
        setEditorStateFromHtml(sanitizedData["remarks"][0]["remark"]);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const updateSubmissionTrackingDetails = () => {
    const updatedErrors = { ...errors };
    let hasErrors = false;
    if (submissionData['remarks'][3]?.['failed'] === false) {
      if (!submissionData.join_date) {
        updatedErrors.join_date = "Date of onboard is required.";
        hasErrors = true;
      } else {
        updatedErrors.join_date = ""; // Clear the error if the date is provided
      }
  
      if (!submissionData.offeredCtc) {
        updatedErrors.offeredCtc = "OfferedCtc is Required";
        hasErrors = true;
      } else {
        updatedErrors.offeredCtc = "";
      }
  
      if (!submissionData.billingRate) {
        updatedErrors.billingRate = "Billing Rate is Required";
        hasErrors = true;
      } else {
        updatedErrors.billingRate = "";
      }
      
      setErrors(updatedErrors);
      
      // Proceed with saving the data if there are no errors
      if (!hasErrors) {
        axiosPrivateCall
        .post(`api/v1/submission/updateSubmissionTracker`, submissionData)
        .then((res) => {
          console.log(res);
          navigateTo("/submission/managesubmissions");
        })
        .catch((e) => console.log(e));
      }
    }else{
      axiosPrivateCall
        .post(`api/v1/submission/updateSubmissionTracker`, submissionData)
        .then((res) => {
          console.log(res);
          navigateTo("/submission/managesubmissions");
        })
        .catch((e) => console.log(e));
    }
  };
  
  

  const checkRejectionLevel = (status) => {
    if (status === "initial_screening_reject") {
      setRejectionLevel(0);
    }

    if (status === "level_1_reject") {
      setRejectionLevel(1);
    }

    if (status === "level_2_reject") {
      setRejectionLevel(2);
    }

    if (status === "final_reject") {
      setRejectionLevel(3);
    }

    if (status === "offer_denied") {
      setRejectionLevel(4);
    }

    if (status === "onboard_reject") {
      setRejectionLevel(6);
    }
    if (status === "bg_verification_reject") {
      setRejectionLevel(5);
    }
  };
  
  const statusDropdownHandler = (e, item) => {
    const remarksArr = submissionData["remarks"];

    if (item.key === "initial_screening_select") {
      remarksArr[0]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "initial_screening_reject") {
      remarksArr[0]["failed"] = true;
      setRejectionLevel(0);
    }

    if (item.key === "level_1_select") {
      remarksArr[1]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "level_1_reject") {
      remarksArr[1]["failed"] = true;
      setRejectionLevel(1);
    }

    if (item.key === "level_2_select") {
      remarksArr[2]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "level_2_reject") {
      remarksArr[2]["failed"] = true;
      setRejectionLevel(2);
    }

    if (item.key === "final_select") {
      remarksArr[3]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "final_reject") {
      remarksArr[3]["failed"] = true;
      setRejectionLevel(3);
    }

    if (item.key === "offer_accept") {
      remarksArr[4]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "offer_denied") {
      remarksArr[4]["failed"] = true;
      setRejectionLevel(4);
    }

    if (item.key === "onboard_select") {
      remarksArr[5]["failed"] = false;
      setRejectionLevel(7);
    }

    if (item.key === "onboard_reject") {
      remarksArr[5]["failed"] = true;
      setRejectionLevel(5); // Use 5 for Offer Denied
    }

    if (item.key === "bg_verification_select") {
      remarksArr[6]["failed"] = false;
      setRejectionLevel(7);
      
    }

    if (item.key === "bg_verification_reject") {
      remarksArr[6]["failed"] = true;
      setRejectionLevel(6);
    }

    setSubmissionData((prevData) => {
      setCurrentHover("");

      return {
        ...prevData,
        status: item.key,
        remarks: [...remarksArr],
      };
    });
  };

  const setEditorStateFromHtml = (html) => {
    const contentBlocks = convertFromHTML(html);

    const contentState = ContentState.createFromBlockArray(
      contentBlocks.contentBlocks,
      contentBlocks.entityMap
    );

    setEditorState(EditorState.createWithContent(contentState));
  };

  const editorStateHandler = (editorState) => {
    const remarksArr = submissionData["remarks"];

    remarksArr[currentLevel]["remark"] = draftToHtml(
      convertToRaw(editorState.getCurrentContent())
    );

    setSubmissionData((prevData) => {
      return {
        ...prevData,
        remarks: remarksArr,
      };
    });

    setEditorState(editorState);
  };

  useEffect(() => {
    getSubmissionTrackingDetails();
    console.log("iji");
  }, []);

  useEffect(() => {
    if (
      submissionData["remarks"][currentLevel]?.remark ||
      submissionData["remarks"][currentLevel]?.remark === ""
    ) {
      const html = submissionData["remarks"][currentLevel]?.remark;

      setEditorStateFromHtml(html);
    }
  }, [currentLevel, submissionData]);

  function dynamicStatus(status) {
    let requiredStatus = [];

    if (status === "") {
      requiredStatus = [
        { key: "initial_screening_select", text: "Initial Screening Select" },
        { key: "initial_screening_reject", text: "Initial Screening Reject" },
      ];
    }

    if (status === "initial_screening_select") {
      requiredStatus = [
        { key: "level_1_select", text: "Level 1 Select" },
        { key: "level_1_reject", text: "Level 1 Reject" },
      ];
    } else if (status === "initial_screening_select") {
      requiredStatus = [];
    }

    if (status === "level_1_select") {
      requiredStatus = [
        { key: "level_2_select", text: "Level 2 Select" },
        { key: "level_2_reject", text: "Level 2 Reject" },
      ];
    } else if (status === "level_1_reject") {
      requiredStatus = [];
    }

    if (status === "level_2_select") {
      requiredStatus = [
        { key: "final_select", text: "Final Select" },
        { key: "final_reject", text: "Final Reject" },
      ];
    } else if (status === "level_2_reject") {
      requiredStatus = [];
    }

    if (status === "final_select") {
      requiredStatus = [
        
        { key: "offer_accept", text: "Offer Accept" },
        { key: "offer_denied", text: "Offer Denied" },
        
      ];
    } else if (status === "final_reject") {
      requiredStatus = [];
    }

    if (status === "offer_accept") {
      requiredStatus = [
        { key: "onboard_select", text: "Onboard Select" },
        { key: "onboard_reject", text: "Onboard Reject" },
      ];
    } else if (status === "offer_denied") {
      requiredStatus = [];
    }

    if (status === "onboard_select") {
      requiredStatus = [
        { key: "bg_verification_select", text: "BG Verification Select" },
        { key: "bg_verification_reject", text: "BG Verification Reject" },
      ];
    } else if (status === "onboard_reject") {
      requiredStatus = [];
    }

    return requiredStatus;
  }

  const downloadEmployees = () => {
    axiosPrivateCall
      .get(
        `api/v1/submission/downloadTrackSubmissions?submission_id=${searchParams.get(
          "submission_id"
        )}`,
        {
          responseType: "blob",
        }
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const inputChangeHandler = (e, inputName) => {
    const {value} = e.target
    let inputVlaue = value
    e.preventDefault();
    setSubmissionData({
      ...submissionData,
      [inputName]: inputVlaue,
    });
    setErrors({
      ...errors,
      [inputName]: "",
    });
    setCurrentHover("");
  };


  const dateHandler = (date, name) => {
    setSubmissionData({
      ...submissionData,
      [name]: date,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
    setCurrentHover(""); // Reset the currentHover state
  };
  const hoverHandler = (name) => {
    setCurrentHover(name);
  };
  let minDate = new Date();
  

  return (
    <div className={styles.track_contaienr}>
      <div className={styles.track_modal_header_container}>
        <div className={styles.header_tag_expand_close_icon_container}>
          <div className={styles.header_tag_container}>Submission Tracker</div>
        </div>

        <div className={styles.header_content_container}>
          <div className={styles.header_content_title_container}>
            <div className={styles.header_submission_id_container}>
              Submission Id : {submissionId}
            </div>

            <div className={styles.header_save_close_btns_container}>
              <FontIcon
                iconName="Download"
                className={iconClass}
                onClick={downloadEmployees}
              />

              <PrimaryButton
                text={`Save & Close`}
                onClick={updateSubmissionTrackingDetails}
                iconProps={{ iconName: "Save" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.track_submission_demand_candidate_status_container}
      >
        <div className={styles.track_submission_demand_id_container}>
          <div className={styles.track_submission_demand_id_title}>
            Demand ID
          </div>
          <TextField readOnly value={demandId} styles={textFieldStyle} />
        </div>
        <div className={styles.track_submission_candidate_id_container}>
          <div className={styles.track_submission_candidate_id_title}>
            Candidate ID
          </div>

          <TextField readOnly value={candidateId} styles={textFieldStyle} />
        </div>
        <div className={styles.track_submission_status_dropdown_container}>
          <div className={styles.track_submission_dropdown_title}>Status</div>
          <div onClick={() => setCurrentHover("status")}>
            <Dropdown
              placeholder="Select"
              options={dynamicStatus(presubmissionData.status)}
              selectedKey={submissionData.status}
              notifyOnReselect
              styles={(props) =>
                dropDownStyles(props, currentHover, "error", "status")
              }
              onChange={statusDropdownHandler}
            />
          </div>
        </div>
      </div>

      {submissionData['remarks'][3]?.['failed'] === false ? (
        <>
          <div
            className={
              styles.track_submission_demand_candidate_status_container
            }
          >
            <div className={styles.track_submission_demand_id_container}>
              <div className={styles.track_submission_demand_id_title}>
                Date of onboard
              </div>
              <div id="join_date" onClick={() => hoverHandler("join_date")}>
                <DatePicker
                  placeholder={"DD/MM/YYYY"}
                  minDate={minDate}
                  styles={(props) =>
                    calendarClass(
                      props,
                      currentHover,
                      errors.join_date,
                      "join_date"
                    )
                  }
                  onSelectDate={(date) => {
                    dateHandler(date, "join_date");
                  }}
				  value={submissionData?.join_date ? new Date(submissionData?.join_date) : ""}
				  
                />
              </div>
            </div>
            <div className={styles.track_submission_candidate_id_container}>
              <div className={styles.track_submission_candidate_id_title}>
                Offered CTC
              </div>
              <TextField
                styles={(props) =>
                  textFieldColored(
                    props,
                    currentHover,
                    errors.offeredCtc,
                    "offeredCtc"
                  )
                }
                onChange={(e) => {
                  inputChangeHandler(
                    e,
                    "offeredCtc",
                  );
                }}
                value={submissionData.offeredCtc}
                placeholder={"offered ctc"}
                // styles={basicInfoerrors.expected_ctc ? FieldError : Field1}
              />
            </div>
            <div className={styles.track_submission_status_dropdown_container}>
              <div className={styles.track_submission_dropdown_title}>
                Billing Rate
              </div>
              <TextField
                styles={(props) =>
                  textFieldColored(
                    props,
                    currentHover,
                    errors.billingRate,
                    "billingRate"
                  )
                }
                onChange={(e) => {
                  inputChangeHandler(
                    e,
                    "billingRate",
                  );
                }}
                value={submissionData.billingRate}
                placeholder={"billing Rate"}
                // styles={basicInfoerrors.expected_ctc ? FieldError : Field1}
              />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}

      <div className={styles.track_submission_content_container}>
        <div
          className={
            styles.track_submission_demand_candidate_status_thumbs_container
          }
        >
          <div
            className={`${styles.track_submission_progress_thumb_title_container}`}
            data-title={"Initial Screening"}
          >
            <div
              onClick={() => setCurrentLevel(0)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 0 ? styles.current : null
              } 
							${
                submissionData.remarks[0]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[0]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel === 0 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
            {/* <div  className={styles.track_submission_status_title_container}>
							Initial Discussion
						</div> */}
          </div>

          <div
            className={`${styles.track_submission_progress_thumb_title_container}`}
            data-title={"Level 1"}
          >
            <div
              onClick={() => setCurrentLevel(1)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 1 ? styles.current : null
              }
							${
                submissionData.remarks[1]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[1]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 1 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
          </div>
          <div
            className={styles.track_submission_progress_thumb_title_container}
            data-title={"Level 2"}
          >
            <div
              onClick={() => setCurrentLevel(2)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 2 ? styles.current : null
              } 
							${
                submissionData.remarks[2]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[2]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 2 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
          </div>
          <div
            className={`${styles.track_submission_progress_thumb_title_container}`}
            data-title={"Final Select"}
          >
            <div
              onClick={() => setCurrentLevel(3)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 3 ? styles.current : null
              }
							${
                submissionData.remarks[3]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[3]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 3 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
          </div>
          <div
            className={`${styles.track_submission_progress_thumb_title_container}`}
            data-title={"Offered"}
          >
            <div
              onClick={() => setCurrentLevel(4)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 4 ? styles.current : null
              } 
							${
                submissionData.remarks[4]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[4]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 4 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
          </div>
          <div
            className={`${styles.track_submission_progress_thumb_title_container}`}
            data-title={"Onboard"}
          >
            <div
              onClick={() => setCurrentLevel(5)}
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 5 ? styles.current : null
              } ${
                submissionData.remarks[5]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[5]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 5 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcSet=""
              />
            </div>
          </div>

          <div
            onClick={() => setCurrentLevel(6)}
            className={styles.track_submission_progress_thumb_title_container}
            data-title={"BG Verification"}
          >
            <div
              className={`${styles.track_submission_progress_thumb_container} ${
                currentLevel === 6 ? styles.current : null
              }
							${
                submissionData.remarks[6]?.failed === ""
                  ? styles.thumb_grey
                  : submissionData.remarks[6]?.failed === false
                  ? styles.thumb_green
                  : styles.thumb_red
              }`}
            >
              <img
                className={styles.track_submission_progress_thumb}
                src={rejectionLevel <= 6 ? thumbsdownwhite : thumbsupwhite}
                alt=""
                srcset=""
              />
            </div>
          </div>
          
        </div>
        <div className={styles.track_submission_remarks_container}>
          <div className={styles.track_submission_remarks_title}>REMARKS</div>

          <div
            className={`${styles.main_wysiwyg_container} ${
              submissionData["remarks"][currentLevel]?.remark.length > 0
                ? styles.main_wysiwyg_container_focus
                : ""
            }`}
          >
            <Editor
              wrapperClassName={styles.editor_wrapper}
              toolbar={editorToolbarOptions}
              toolbarOnFocus
              toolbarClassName={styles.editor_toolbar}
              editorClassName={styles.editor_editor}
              placeholder="Click to Add Remarks"
              editorState={editorState}
              onEditorStateChange={editorStateHandler}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackSubmission;