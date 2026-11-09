import React, {useRef, useState, useEffect} from "react";
import {
  Modal,
  Tabs,
  Button,
  Radio,
  Space,
  message,
  Typography,
  Checkbox,
  Spin,
  Upload,
} from "antd";
import {
  EditOutlined,
  UploadOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import SignatureService from "../../services/signatureService";
import {resolveMediaUrl} from "../../utils/mediaUtils";

const {Text} = Typography;

const SignaturePadModal = ({
  visible,
  onCancel,
  onConfirm,
  roleTitle = "Ký duyệt",
  mode = "sign",
}) => {
  const [activeTab, setActiveTab] = useState("draw");
  const [penColor, setPenColor] = useState("#002b80");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [savedProfileSig, setSavedProfileSig] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileImgError, setProfileImgError] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [saveAsProfile, setSaveAsProfile] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setHasDrawn(false);
    setUploadedImage(null);
    clearCanvas();
    if (mode !== "profile") {
      fetchProfileSignature();
    }
  }, [visible, mode]);

  const fetchProfileSignature = async () => {
    try {
      setLoadingProfile(true);
      setProfileImgError(false);
      const data = await SignatureService.getUserSignature();
      if (data?.signature_url) {
        setSavedProfileSig(data.signature_url);
      }
    } catch {
      // Ignore if no saved signature
    } finally {
      setLoadingProfile(false);
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const {x, y} = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    isDrawing.current = true;
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const {x, y} = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileProcess = (file) => {
    if (!file) return;
    const isImage =
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg";
    if (!isImage) {
      message.error("Vui lòng chọn tệp ảnh định dạng PNG hoặc JPG!");
      return;
    }
    const isLt2M = file.size / 1024 / 1024 <= 2;
    if (!isLt2M) {
      message.error("Kích thước file ảnh chữ ký tối đa là 2MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUploadedImage(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOk = async () => {
    if (!agreed) {
      message.warning("Vui lòng xác nhận cam kết trước khi ký.");
      return;
    }
    let sigData = null;
    if (activeTab === "draw") {
      if (!hasDrawn) {
        message.warning("Vui lòng vẽ chữ ký của bạn lên khung.");
        return;
      }
      sigData = canvasRef.current.toDataURL("image/png");
    } else if (activeTab === "upload") {
      if (!uploadedImage) {
        message.warning("Vui lòng chọn ảnh chữ ký.");
        return;
      }
      sigData = uploadedImage;
    } else if (activeTab === "profile") {
      if (!savedProfileSig) {
        message.warning("Bạn chưa có chữ ký mẫu cá nhân.");
        return;
      }
      sigData = savedProfileSig;
    }

    if (saveAsProfile && sigData && activeTab !== "profile") {
      try {
        await SignatureService.saveUserSignature(sigData);
      } catch {
        // Non-blocking
      }
    }

    onConfirm(sigData);
  };

  const tabItems = [
    {
      key: "draw",
      label: (
        <span>
          <EditOutlined /> Vẽ trực tiếp
        </span>
      ),
      children: (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Space>
              <Text style={{fontSize: 13}}>Mực:</Text>
              <Radio.Group
                size="small"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
              >
                <Radio.Button
                  value="#002b80"
                  style={{color: "#002b80", fontWeight: "bold"}}
                >
                  Xanh mực
                </Radio.Button>
                <Radio.Button
                  value="#000000"
                  style={{color: "#000000", fontWeight: "bold"}}
                >
                  Đen
                </Radio.Button>
              </Radio.Group>
            </Space>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={clearCanvas}
            >
              Xóa nét
            </Button>
          </div>
          <div
            style={{
              border: "1.5px dashed #cbd5e1",
              borderRadius: 8,
              background: "#f8fafc",
              touchAction: "none",
              textAlign: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{cursor: "crosshair", display: "block", margin: "0 auto"}}
            />
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Ký bằng chuột, touchpad hoặc bút cảm ứng trên khung viền
          </div>
        </div>
      ),
    },
    {
      key: "upload",
      label: (
        <span>
          <UploadOutlined /> Tải ảnh lên
        </span>
      ),
      children: (
        <div style={{padding: "8px 0"}}>
          {!uploadedImage ? (
            <Upload.Dragger
              accept="image/png,image/jpeg,image/jpg"
              showUploadList={false}
              beforeUpload={(file) => {
                handleFileProcess(file);
                return false;
              }}
              style={{
                padding: "24px 0",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1.5px dashed #cbd5e1",
              }}
            >
              <p style={{marginBottom: 8}}>
                <UploadOutlined style={{fontSize: 36, color: "#1890ff"}} />
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#1f2937",
                  margin: "0 0 4px 0",
                }}
              >
                Nhấp chuột hoặc kéo thả ảnh chữ ký vào đây
              </p>
              <p style={{color: "#94a3b8", fontSize: 12, margin: 0}}>
                Hỗ trợ định dạng PNG, JPG (hệ thống sẽ tự động tách nền và xén
                viền)
              </p>
            </Upload.Dragger>
          ) : (
            <div style={{textAlign: "center"}}>
              <div
                style={{
                  padding: 16,
                  border: "1.5px dashed #10b981",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  marginBottom: 12,
                }}
              >
                <img
                  src={uploadedImage}
                  alt="Signature Preview"
                  style={{
                    maxHeight: 130,
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <Space>
                <Upload
                  accept="image/png,image/jpeg,image/jpg"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleFileProcess(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh khác</Button>
                </Upload>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setUploadedImage(null)}
                >
                  Xóa ảnh này
                </Button>
              </Space>
            </div>
          )}
        </div>
      ),
    },
    ...(mode !== "profile"
      ? [
          {
            key: "profile",
            label: (
              <span>
                <UserOutlined /> Chữ ký cá nhân
              </span>
            ),
            children: (
              <div style={{textAlign: "center", padding: "16px 0"}}>
                {loadingProfile ? (
                  <Spin tip="Đang tải chữ ký mẫu..." />
                ) : savedProfileSig && !profileImgError ? (
                  <div
                    style={{
                      padding: 12,
                      border: "1px dashed #22c55e",
                      borderRadius: 8,
                      background: "#f0fdf4",
                    }}
                  >
                    <img
                      src={resolveMediaUrl(savedProfileSig)}
                      alt="Profile Sig"
                      onError={() => setProfileImgError(true)}
                      style={{
                        maxHeight: 120,
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                    />
                    <div
                      style={{
                        color: "#16a34a",
                        fontSize: 13,
                        marginTop: 6,
                        fontWeight: 500,
                      }}
                    >
                      ✓ Đã tìm thấy mẫu chữ ký trong tài khoản của bạn
                    </div>
                  </div>
                ) : (
                  <div style={{color: "#64748b", padding: 16}}>
                    Bạn chưa lưu chữ ký mẫu trong hồ sơ cá nhân. Vui lòng vẽ
                    hoặc tải ảnh ở hai tab bên cạnh.
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Modal
      title={<span>🖋️ {roleTitle}</span>}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText={mode === "profile" ? "Lưu chữ ký" : "Xác nhận ký"}
      cancelText="Hủy"
      width={520}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <div
        style={{marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 12}}
      >
        {mode !== "profile" && activeTab !== "profile" && (
          <div style={{marginBottom: 8}}>
            <Checkbox
              checked={saveAsProfile}
              onChange={(e) => setSaveAsProfile(e.target.checked)}
            >
              Lưu chữ ký này làm mẫu cá nhân cho các lần sau
            </Checkbox>
          </div>
        )}
        <Checkbox
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        >
          {mode === "profile"
            ? "Tôi xác nhận đây là chữ ký cá nhân hợp lệ của tôi dùng cho việc phê duyệt/ban hành đề cương."
            : "Tôi xác nhận đây là chữ ký hợp lệ của tôi và cam kết chịu trách nhiệm về nội dung đề cương."}
        </Checkbox>
      </div>
    </Modal>
  );
};

export default SignaturePadModal;
