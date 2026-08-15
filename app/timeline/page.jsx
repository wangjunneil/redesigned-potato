"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PlusOutlined,
  CalendarOutlined,
  CalendarFilled,
  DeleteOutlined,
  DeleteFilled,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  Timeline,
  Divider,
  FloatButton,
  Select,
  Modal,
  Skeleton,
  Spin,
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
import { splitDate, PAGE_SIZE } from "@/utils";

const TimeLinePage = () => {
  const [year] = splitDate();
  const [open, setOpen] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [timeLineData, setTimeLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(year);

  // 加载时间线数据
  const loadTimeLineData = useCallback(async (yearValue, lastId = null, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const res = await queryTimeLineAll({ status: "ENABLED", year: yearValue, lastId, limit: PAGE_SIZE });
      if (append) {
        setTimeLineData(prev => [...prev, ...res]);
      } else {
        setTimeLineData(res);
      }
      setHasMore(res.length === PAGE_SIZE);
      if (res.length > 0) {
        setLastId(res[res.length - 1]._id);
      }
    } catch (error) {
      console.error("加载时间线数据失败:", error);
      message.error("加载数据失败，请稍后重试");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    (async () => {
      try {
        // 加载年份列表
        const yearsList = await enumTimeLineYear();
        setYears(yearsList);

        // 年份变更时重置分页状态
        setLastId(null);
        setHasMore(true);
        await loadTimeLineData(selectedYear, null, false);
      } catch (error) {
        console.error("初始化失败:", error);
        message.error("初始化失败，请刷新页面");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // 当删除操作完成后重新加载数据（从头加载）
  useEffect(() => {
    if (!isDelete) {
      setLastId(null);
      setHasMore(true);
      loadTimeLineData(selectedYear, null, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDelete]);

  // 无限滚动：使用 IntersectionObserver 监听底部哨兵元素
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadTimeLineData(selectedYear, lastId, true);
      }
    }, { rootMargin: "200px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, lastId, selectedYear, loadTimeLineData]);

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
        <TimelineErrorBoundary key={`error-${item._id || item.id}`}>
          <NodeChild
            key={`child-${item._id || item.id}`}
            timeLine={item}
            isDelete={isDelete}
            setIsDelete={setIsDelete}
            setLoading={setLoading}
          />
        </TimelineErrorBoundary>
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
      <Skeleton active={true} loading={loading && !loadingMore}>
        <Timeline mode="left" items={timelineItems} />

        {/* 滚动加载哨兵 + loading 指示器 */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Spin size="small" />
            <span style={{ marginLeft: 8, color: "#999", fontSize: 13 }}>加载中...</span>
          </div>
        )}
        {!hasMore && timeLineData.length > 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#bbb", fontSize: 13 }}>没有更多了</div>
        )}

        <FloatButton.Group shape="square">
          <FloatButton.BackTop />
          {expanded && (
            <>
              <FloatButton
                className="timeline-float-action"
                style={{ animationDelay: "0ms" }}
                icon={showModel ? <CalendarFilled /> : <CalendarOutlined />}
                onClick={() => {
                  setShowModel(true);
                  setExpanded(false);
                }}
              />
              <FloatButton
                className="timeline-float-action"
                style={{ animationDelay: "60ms" }}
                onClick={() => {
                  setIsDelete(!isDelete);
                  setExpanded(false);
                }}
                icon={isDelete ? <DeleteFilled /> : <DeleteOutlined />}
              />
              <FloatButton
                className="timeline-float-action"
                style={{ animationDelay: "120ms" }}
                onClick={() => {
                  setOpen(true);
                  setExpanded(false);
                }}
                icon={<PlusOutlined />}
              />
            </>
          )}
          <FloatButton
            className="timeline-float-trigger"
            icon={expanded ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setExpanded(!expanded)}
          />
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

      <NewTimeLine open={open} setOpen={setOpen} onSuccess={() => { setLastId(null); setHasMore(true); loadTimeLineData(selectedYear, null, false); }} />

      <PWAInstallPrompt />
    </div>
  );
};

export default TimeLinePage;

class TimelineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Timeline item render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: "#999", fontSize: 12, padding: 8 }}>此条目渲染失败</div>;
    }
    return this.props.children;
  }
}
