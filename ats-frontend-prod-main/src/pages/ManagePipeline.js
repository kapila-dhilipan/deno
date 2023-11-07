import React, { useEffect, useState } from "react";
import styles from "./ManageEmployee.module.css"
import { PrimaryButton, SearchBox, FontIcon, mergeStyles, mergeStyleSets, DefaultButton, Callout, DirectionalHint, MessageBar, MessageBarType } from '@fluentui/react';
import { Shimmer } from '@fluentui/react';
import { useNavigate } from "react-router-dom";
import InfiniteScroll from 'react-infinite-scroll-component';
import { axiosPrivateCall } from "../constants";
import AddPipeline from "./AddPipelineModal";
import { DeletePopup } from "../components/DeletePopup";

const addIcon = { iconName: 'Add' };
const searchIcon = { iconName: 'Search' };

const iconClass = mergeStyles({
    fontSize: 20,
    height: 20,
    width: 20,
    margin: '0 10px',
    color: '#999DA0',
    cursor: 'pointer'
});

const iconClass1 = mergeStyles({
    fontSize: 12,
    height: 12,
    width: 12,
    margin: '0 ',
    color: '#999DA0',
    cursor: 'pointer'
});

const messageBarStyles = {
    content: {
        maxWidth: 620,
        minWidth: 450,
    }
}

const searchFieldStyles = mergeStyleSets({
    root: { width: '185px', },
});

const calloutBtnStyles = {
    root: {
        border: 'none',
        padding: '0px 10px',
        textAlign: 'left',
        height: '20px',
    }
}

let items = Array(4).fill(null);

function ManagePipeline(props) {
    const [showMessageBar, setShowMessageBar] = useState(false);
    const [showSubStauts, setShowSubStatus] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false)
    const [isSubmitSuccess, setSubmitSuccess] = useState(false);
    const [clientData, setClientData] = useState('');
    const [deleteId, setDeleteID] = useState('')
    const [updateId, setUpdateId] = useState('')
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [rowId, setRowId] = useState('');
    const [updateCallout, setUpdateCallout] = useState(false);
    const [showdeleteMessageBar, setShowDeleteMessageBar] = useState(false);
    const [opportunityId, setOpportunity] = useState()
    const [hasMore, setHasMore] = useState(true)
    const navigateTo = useNavigate();

    const columns = [
        {
            columnKey: "Opportunity ID",
            label: "Opportunity ID"
        }, {
            columnKey: "Opportunity Type",
            label: "Opportunity Type"
        }, {
            columnKey: "Account/Lead",
            label: "Account/Lead"
        }, {
            columnKey: "Geo/Location",
            label: "Geo/Location"
        }, {
            columnKey: "Entry Date",
            label: "Entry Date"
        }, {
            columnKey: "Closure Date",
            label: "Closure Date"
        }, {
            columnKey: "Funnel Stage",
            label: "Funnel Stage"
        }, {
            columnKey: "POC/Source",
            label: "POC/Source"
        }, {
            columnKey: "BU Head",
            label: "BU Head"
        }, {
            columnKey: "Deal $K ",
            label: "Deal $K"
        }, {
            columnKey: "Conf., Percentage",
            label: "Conf., Percentage"
        }, {
            columnKey: "Conf., Adjust Deal",
            label: "Conf., Adjust Deal"
        },
        {
            columnKey: "Short Status",
            label: "Short Status"
        },
    ]

    useEffect(() => {
        getClientData()
    }, [isModalOpen])

    const getClientData = () => {
        setIsDataLoaded(false)
        axiosPrivateCall.get('/api/v1/crm/getclientdata').then(res => {
            setClientData(res.data);
            setIsDataLoaded(true)
        })
    }

    const searchclientData = (e) => {

    }

    const clearSearchBox = () => {

    }

    const deletePipeline = (id) => {

        setUpdateCallout(!updateCallout)
        setShowPopup(!showPopup);
        const deleteObj = { _id: id.opportunity_id }
        setDeleteID(deleteObj)
        setUpdateId({ _id: id._id })
    }
    useEffect(() => {
        if (showdeleteMessageBar) {
            setTimeout(() => {
                setShowDeleteMessageBar(!showdeleteMessageBar)
            }, 3500)
        }

    }, [showdeleteMessageBar])

    useEffect(() => {

        if (showMessageBar) {
            setTimeout(() => {
                setShowMessageBar(!showMessageBar)
            }, 3500)
        }

    }, [showMessageBar])

    const downloadClients = () => {

    }

    const handleUpdate = (showpop) => {
        const deleteObj = { _id: updateId };
        if (!showpop) {
            setShowPopup(!showPopup)
            axiosPrivateCall.post(`/api/v1/crm/deleteClientData/${deleteObj._id._id}`).then(res => {
                setShowDeleteMessageBar(!showdeleteMessageBar)
                const demandArrList = clientData
                setClientData(demandArrList.filter(clientData => clientData._id !== deleteObj._id._id));
            }).catch(e => {
                setUpdateCallout(false)
            })
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>

                <DeletePopup showPopup={showPopup}
                    setShowPopup={setShowPopup}
                    handleUpdate={handleUpdate}
                    deleteId={deleteId}
                    updateCallout={updateCallout}
                    setUpdateCallout={setUpdateCallout}
                    opportunityId={opportunityId}
                />

                {isModalOpen && <AddPipeline
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                    isSubmitSuccess={isSubmitSuccess}
                    setSubmitSuccess={setSubmitSuccess}
                    setShowMessageBar={setShowMessageBar}
                    showMessageBar={showMessageBar}

                />}

                <div className={styles.nav_container}>
                    <div className={styles.title}>Manage Sales Pipeline</div>

                    {showMessageBar && <div >
                        <MessageBar onDismiss={() => setShowMessageBar(!showMessageBar)} styles={messageBarStyles} dismissButtonAriaLabel="Close" messageBarType={MessageBarType.success}>
                            Client added successfully
                        </MessageBar>
                    </div>}

                    {showdeleteMessageBar && <div >
                        <MessageBar onDismiss={() => setShowDeleteMessageBar(showSubStauts)} styles={messageBarStyles} dismissButtonAriaLabel="Close" messageBarType={MessageBarType.success}>
                            data deleted successfully
                        </MessageBar>
                    </div>}

                    <div className={styles.nav_items}>
                        <SearchBox onSearch={(e) => searchclientData(e)} onClear={clearSearchBox} iconProps={searchIcon} className={styles.search} styles={searchFieldStyles} />
                        <FontIcon iconName="Breadcrumb" className={iconClass} />
                        <PrimaryButton text="Add New" iconProps={addIcon}
                            onClick={() => { setIsModalOpen(!isModalOpen); setSubmitSuccess(false); }} />
                        <FontIcon onClick={downloadClients} iconName="Download" className={iconClass} />
                    </div>
                </div>

                <div id="scrollableDiv" className={styles.table_container}>
                    <InfiniteScroll style={{ overflow: 'visible', height: '100%' }} dataLength={clientData.length} loader={isDataLoaded && clientData.length >= 15
                    }
                        hasMore={hasMore} scrollableTarget="scrollableDiv">
                        <table>
                            <thead className={styles.table_header}>
                                <tr className={styles.table_row}>
                                    {columns.map((column) =>
                                        <th className={styles.table_headerContents} key={column.columnKey}>
                                            <div
                                                className={styles.table_heading}>
                                                <div>{column.label}</div>
                                                {column?.icon ? <FontIcon iconName={column.icon} className={iconClass1} /> : null}
                                            </div>
                                        </th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {isDataLoaded && clientData?.map((data) =>
                                    <tr className={data.status ? `${styles.table_row}` : `${styles.table_row_idle}`} key={data._id}>
                                        <td onClick={() => navigateTo(`/reports/editpipeline?client_id=${data._id}`, { state: data })} className={styles.table_dataContents}>{data.opportunity_id || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.opportunity_type || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.account_lead || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.geo_location || '-'}</td>
                                        <td className={styles.table_dataContents}>{(new Date(data.entry_date)).toLocaleDateString('en-GB')}</td>
                                        <td className={styles.table_dataContents}>{(new Date(data.closure_date)).toLocaleDateString('en-GB')}</td>
                                        <td className={styles.table_dataContents}>{data.funnel_stage || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.poc_source || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.bu_lead || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.deal_$K || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.conf_percentage || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.conf_adjust_deal || '-'}</td>
                                        <td className={styles.table_dataContents}>{data.short_status || '-'}</td>
                                        <td className={styles.table_dataContents}>
                                            <div id={`Dp${data._id}`} onClick={() => { setRowId(data._id); setUpdateCallout(true) }} className={styles.moreOptions}>
                                                <FontIcon iconName='MoreVertical' className={iconClass1} />
                                                {rowId === data._id &&
                                                    updateCallout && <Callout gapSpace={0} target={`#Dp${data._id}`} onDismiss={() => setRowId('')}
                                                        isBeakVisible={false} directionalHint={DirectionalHint.bottomCenter}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>

                                                            <DefaultButton onClick={() => deletePipeline(data)} text="Delete" styles={calloutBtnStyles} />
                                                        </div>
                                                    </Callout>
                                                }
                                            </div>
                                        </td>
                                    </tr>)
                                }

                                {!isDataLoaded && items.map(client =>
                                    <tr className={styles.table_row} >
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}><Shimmer /></td>
                                        <td className={styles.table_dataContents}>
                                            <div className={styles.moreOptions} >

                                                <FontIcon iconName='MoreVertical' className={iconClass1} />
                                            </div>
                                        </td>

                                    </tr>)}

                            </tbody>
                        </table>
                    </InfiniteScroll>
                </div>
            </div>
        </div>
    );

};

export default ManagePipeline;







