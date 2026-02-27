import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { DownloadOutlined, CloseOutlined } from "@ant-design/icons";
import "./PWAInstallPrompt.scss";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

    if (isInstalled) {
      return;
    }

    // 检查是否已经关闭过提示
    const promptDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (promptDismissed) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('用户接受了安装');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <DownloadOutlined />
        </div>
        <div className="pwa-install-text">
          <div className="pwa-install-title">安装应用到主屏幕</div>
          <div className="pwa-install-desc">随时记录生活点滴</div>
        </div>
        <div className="pwa-install-actions">
          <Button
            type="primary"
            size="small"
            onClick={handleInstall}
            className="pwa-install-btn"
          >
            安装
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            className="pwa-close-btn"
          />
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
