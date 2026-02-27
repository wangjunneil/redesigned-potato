"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Modal,
  Skeleton,
  message,
} from "antd";
import "./page.scss";
import NodeLabel from "@/components/timeline/NodeLabel";
import NodeChild from "@/components/timeline/NodeChild";
import NewTimeLine from "../../components/timeline/NewTimeLine";
import PWAInstallPrompt from "@/components/timeline/PWAInstallPrompt";
import {
  enumTimeLineYear,
  queryTimeLineAll,
} from "@/database/modules/TimeLineDataAction";
import { splitDate } from "@/utils";

const [year, month, day] = splitDate();

const TimeLinePage = () => {
  const [open, setOpen] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [timeLineData, setTimeLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(year);

  // 加载时间线数据
  const loadTimeLineData = useCallback(async (yearValue) => {
    try {
      setLoading(true);
      const res = await queryTimeLineAll({ status: "ENABLED", year: yearValue });
      setTimeLineData(res);
    } catch (error) {
      console.error("加载时间线数据失败:", error);
      message.error("加载数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    (async () => {
      try {
        // 加载年份列表
        const yearsList = await enumTimeLineYear();
        setYears(yearsList);

        // 加载当前年份数据
        await loadTimeLineData(selectedYear);
      } catch (error) {
        console.error("初始化失败:", error);
        message.error("初始化失败，请刷新页面");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // 当删除操作完成后重新加载数据
  useEffect(() => {
    if (!isDelete) {
      loadTimeLineData(selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDelete]);

  const handleChange = (value) => {
    setShowModel(false);
    setSelectedYear(value);
  };

  const yearModalClose = () => {
    setShowModel(false);
  };

  // 使用 useMemo 优化 Timeline items 的创建
  const timelineItems = useMemo(() => {
    return timeLineData.map((item) => ({
      key: item._id || item.id,
      label: <NodeLabel timeLine={item} />,
      color: "gray",
      children: (
        <NodeChild
          key={`child-${item._id || item.id}`}
          timeLine={item}
          isDelete={isDelete}
          setIsDelete={setIsDelete}
          setLoading={setLoading}
        />
      ),
    }));
  }, [timeLineData, isDelete]);

  return (
    <div className="my-8 mx-auto w-5/6">
      <h1 className="text-2xl text-center font-600">
        时间胶囊
        <span className="text-xs text-zinc-400 pl-2">
          WaitFor Open It, Since 2023.09.01
        </span>
      </h1>
      <Divider orientation="left" plain></Divider>
      <Skeleton active={true} loading={loading}>
        <Timeline mode="left" items={timelineItems} />

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
          value={selectedYear}
          className="px-2 w-36 text-center"
          options={years}
          onChange={handleChange}
        />
      </Modal>

      <NewTimeLine open={open} setOpen={setOpen} onSuccess={() => loadTimeLineData(selectedYear)} />

      <PWAInstallPrompt />
    </div>
  );
};

export default TimeLinePage;
