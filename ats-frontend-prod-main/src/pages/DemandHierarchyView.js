import React, { useRef, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Modal } from '@fluentui/react';
import { PrimaryButton } from '@fluentui/react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './HierarchyView.module.css'
import '../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import HierarchyCard from '../components/HierarchyCard';
import HierarchyArrow from '../components/HieraryArrow';
import { axiosPrivateCall } from '../constants';
import { debounce } from 'lodash';
import { mergeStyles } from '@fluentui/react';


const LazyHierarchyCard = lazy(() => import('../components/HierarchyCard'));
const contractIconClass = mergeStyles({
    fontSize: 20,
    height: 20,
    width: 20,
    cursor: 'pointer',
});

const closeIconClass = mergeStyles({
    fontSize: 16,
    height: 20,
    width: 20,
    cursor: 'pointer'
})


const DemandHierarchyView = (props) => {
    const token = localStorage.getItem('token');
    let base64Url = token.split('.')[1];
    let decodedValue = JSON.parse(window.atob(base64Url));
    const [userId, setUserId] = useState(decodedValue.user_id)
    const { isModalOpen, setIsModalOpen, showMessageBar, setShowMessageBar, startDate, endDate } = props;
    const [currentHover, setCurrentHover] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isModalShrunk, setIsModalShrunk] = useState(true)
    const [hierarchyDemandData, setHierarchyDemandData] = useState([]);

    const getHierarchyDemandData = debounce(() => {

        if (startDate && endDate && endDate > startDate) {
            axiosPrivateCall.get(`/api/v1/BDE/getHierarchyDemandData?user_id=${userId}&start_date=${formateDate(startDate)}&end_date=${formateDate(endDate)}`)
                .then(res => {
                    setHierarchyDemandData(res.data)
                }).catch(e => console.log(e))
        }
        else {

            axiosPrivateCall.get(`/api/v1/BDE/getHierarchyDemandData?user_id=${userId}`).then(res => {
                setHierarchyDemandData(res.data)
                console.log(res.data, 99);
            }).catch(e => console.log(e))

        }
    }, 500)

    const formateDate = useCallback((date) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month (adding 1 since it's zero-based) and pad with leading zero if necessary
            const day = String(date.getDate()).padStart(2, '0'); // Get the day and pad with leading zero if necessary
            const formattedDate = `${year}-${month}-${day}`;
            return formattedDate
        }
    }, [])
    useEffect(() => {
        getHierarchyDemandData()

    }, [userId, startDate, endDate])
    const modalSizeHandler = () => {
        setIsModalShrunk(!isModalShrunk)
    }
    const hierarchyCardClickHandler = (empId) => {
        setUserId(empId)
    }

    return (
        <div>
            <Modal id="Modal12" scrollableContentClassName={styles.adddemand_modal_scrollable_content} containerClassName={`${isModalShrunk ? styles.adddemand_modal_container_shrunk : styles.adddemand_modal_container}`}
                isOpen={isModalOpen}>
                <div className={styles.adddemand_modal_header_container}>
                    <div className={styles.header_tag_expand_close_icon_container}>
                        <div className={styles.header_tag_container}>
                            View Hierarchy
                        </div>
                        <div className={styles.header_expand_close_icon_container}>
                            <div onClick={modalSizeHandler} className={styles.header_expand_icon_container}>
                                {isModalShrunk ? <Icon iconName='FullScreen' className={contractIconClass} /> :
                                    <Icon iconName='BackToWindow' className={contractIconClass} />}
                            </div>
                            <div onClick={() => setIsModalOpen(false)} className={styles.header_close_icon_container}>
                                <Icon iconName='ChromeClose' className={closeIconClass} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.header_content_container}>
                        <div className={styles.header_content_job_description_unassigned_save_container}>
                            <div className={styles.header_save_close_btns_container}>
                                Overall Active Demand :  {hierarchyDemandData?.total_demands}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.main_filter_options_container}>
                </div>
                <div className={styles.main_information_container}>
                    <Suspense fallback={<div><h1>Loading...</h1></div>}>
                        <LazyHierarchyCard
                            name={hierarchyDemandData?.current_user?.first_name}
                            role={hierarchyDemandData?.current_user?.role}
                            count={hierarchyDemandData?.total_demands}
                            countName={"Demand"}
                            type={'activeDemand'}
                            userId={userId}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </Suspense>
                    {hierarchyDemandData?.subbordinates?.length ? <HierarchyArrow /> : ''}
                    {hierarchyDemandData?.subbordinates?.length ? hierarchyDemandData.subbordinates.map((data, index) => (
                        <div key={data._id} onClick={() => hierarchyCardClickHandler(data._id)}>
                            <Suspense fallback={<div>Loading...</div>}>
                                <LazyHierarchyCard
                                    name={`${data.first_name + ' ' + data.last_name}`}
                                    role={data.role}
                                    type={'activeDemand'}
                                    userId={data._id}
                                    startDate={startDate}
                                    endDate={endDate}
                                />
                            </Suspense>
                            {hierarchyDemandData?.subbordinates?.length !== index + 1 ? <HierarchyArrow /> : ''}
                        </div>
                    )) : ''}
                </div>
            </Modal>
        </div>
    );
};

export default DemandHierarchyView;
