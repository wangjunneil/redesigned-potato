"use client";
import React, { useState, useEffect } from "react";
import {
  PlusOutlined,
  CalendarOutlined,
  CalendarFilled,
  DeleteOutlined,
  DeleteFilled,
} from "@ant-design/icons";
import {
  Timeline,
  Divider,
  FloatButton,
  Select,
  Spin,
  Modal,
  Skeleton,
} from "antd";
import "./page.scss";
import NodeLabel from "@/components/timeline/NodeLabel";
import NodeChild from "@/components/timeline/NodeChild";
import NewTimeLine from "../../components/timeline/NewTimeLine";
import {
  enumTimeLineYear,
  queryTimeLineAll,
} from "@/database/modules/TimeLineDataAction";
import { splitDate } from "@/utils";
import { getSecretValue } from "@/services";

const [year, month, day] = splitDate();

const TimeLinePage = () => {
  const [open, setOpen] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [timeLineData, setTimeLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await queryTimeLineAll({ status: "ENABLED", year: year });
      setLoading(false);
      setTimeLineData(res);
      console.log("timeLineData", res);

      const years = await enumTimeLineYear();
      setYears(years);
    })();
  }, [open, isDelete]);

  const handleChange = (value) => {
    setShowModel(false);
    setLoading(true);
    queryTimeLineAll({ status: "ENABLED", year: value }).then((res) => {
      setLoading(false);
      setTimeLineData(res);
    });
  };

  const yearModalClose = () => {
    setShowModel(false);
  };

  return (
    <div className="my-8 mx-auto w-5/6">
      <h1 className="text-2xl text-center font-600">
        Life Time Line
        <span className="text-xs text-zinc-400 pl-2">Since 2023.09.01</span>
      </h1>
      <Divider orientation="left" plain></Divider>
      <Skeleton active={true} loading={loading}>
        <Timeline
          mode="left"
          items={timeLineData.map((item) => {
            return {
              label: <NodeLabel timeLine={item} />,
              color: "gray",
              children: (
                <NodeChild
                  timeLine={item}
                  isDelete={isDelete}
                  setIsDelete={setIsDelete}
                  setLoading={setLoading}
                />
              ),
            };
          })}
        />

        <FloatButton.Group shape="square">
          <FloatButton
            icon={showModel ? <CalendarFilled /> : <CalendarOutlined />}
            onClick={() => setShowModel(true)}
          />
          <FloatButton
            onClick={() => setIsDelete(!isDelete)}
            icon={isDelete ? <DeleteFilled /> : <DeleteOutlined />}
          />
          <FloatButton onClick={() => setOpen(true)} icon={<PlusOutlined />} />
          <FloatButton.BackTop />
        </FloatButton.Group>
      </Skeleton>

      <Modal
        title="选择日期"
        open={showModel}
        centered={true}
        onOk={yearModalClose}
        onCancel={yearModalClose}
      >
        <Select
          defaultValue={year}
          className="px-2 w-36 text-center"
          options={years}
          onChange={handleChange}
        />
      </Modal>

      <NewTimeLine open={open} setOpen={setOpen} />
    </div>
  );
};

export default TimeLinePage;
