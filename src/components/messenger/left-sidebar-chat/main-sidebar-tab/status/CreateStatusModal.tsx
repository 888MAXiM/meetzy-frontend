import { useCallback, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import mutations from "../../../../../api/mutations";
import { queries } from "../../../../../api";
import { Image } from "../../../../../shared/image";
import type { CreateStatusModalProps } from "../../../../../types/components/chat";
import { createStatusFormData, validateStatusFile } from "../../../../../utils/uploadStatus";
import { ImagePath } from "../../../../../constants";
import { useUserFeatures } from "../../../../../hooks/useUserFeatures";

const CreateStatusModal: React.FC<CreateStatusModalProps> = ({ isOpen, toggle, onSuccess, userAvatar }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createStatusMutation = mutations.useCreateStatus();
    const { t } = useTranslation();
    const { max_status } = useUserFeatures();
    const { data: statusData } = queries.useGetStatusFeed();
    const { data: currentUserData } = queries.useGetUserDetails();
    
    // Count statuses uploaded today
    const todayStatusCount = useMemo(() => {
        if (!statusData?.data || !currentUserData?.user?.id) return 0;
        const myStatusFeed = statusData.data.find((feed) => feed.user.id === currentUserData.user.id);
        if (!myStatusFeed?.statuses) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return myStatusFeed.statuses.filter((status: any) => {
            const statusDate = new Date(status.created_at);
            statusDate.setHours(0, 0, 0, 0);
            return statusDate.getTime() === today.getTime();
        }).length;
    }, [statusData, currentUserData]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateStatusFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!selectedFile) {
            toast.error(t("please_select_file"));
            return;
        }

        // Check status limit
        if (todayStatusCount >= max_status) {
            toast.error(
                t("status_limit_reached") || 
                `You can only upload ${max_status} statuses per day. You have reached your limit.`
            );
            return;
        }

        const formData = createStatusFormData(selectedFile, caption);

        try {
            await createStatusMutation.mutateAsync(formData);
            toast.success(t("status_uploaded_success"));
            onSuccess();
            handleClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || t("status_upload_failed");
            toast.error(errorMessage);
        }
    }, [selectedFile, caption, createStatusMutation, onSuccess, t, todayStatusCount, max_status]);

    const handleClose = useCallback(() => {
        setSelectedFile(null);
        setCaption("");
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toggle();
    }, [toggle]);

    const handleChangeFile = useCallback(() => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const isImage = selectedFile?.type.startsWith('image/');
    const isUploading = createStatusMutation.isPending;

    return (
        <Modal className="add-status-modal" isOpen={isOpen} toggle={handleClose} centered>
            <ModalHeader toggle={handleClose}>{t("create_status")}</ModalHeader>
            <ModalBody>
                {!preview ? (
                    <div className="text-center">
                        <Image
                            src={userAvatar || `${ImagePath}/avatar/placeholder.png`}
                            alt={t("avatar")} className="create-status-img"
                        />
                        <div className="button-aligns">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                aria-label={t("file_input")}
                            />
                            <Button
                                color="primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {t("select_image_or_video")}
                            </Button>
                            <p className="text-muted mt-2 small">
                                {t("file_size_limit")}
                            </p>
                            {todayStatusCount >= max_status && (
                                <p className="text-danger mt-2 small">
                                    {t("status_limit_reached") || `Daily limit reached (${max_status}/${max_status})`}
                                </p>
                            )}
                            {todayStatusCount < max_status && (
                                <p className="text-muted mt-2 small">
                                    {`You can upload ${max_status - todayStatusCount} more status(es) today`}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="preview-container mb-3">
                            {isImage ? (
                                <Image
                                    src={preview}
                                    alt={t("preview")}
                                    className="preview-container-img"
                                />
                            ) : (
                                <video
                                    src={preview}
                                    className="preview-container-video"
                                    controls
                                />
                            )}
                        </div>
                        <FormGroup>
                            <Label for="caption">{t("caption_optional")}</Label>
                            <Input
                                type="textarea"
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder={t("add_caption_placeholder")}
                                rows={3}
                                maxLength={200}
                            />
                            <small className="text-muted">{caption.length}/200</small>
                        </FormGroup>
                        <Button color="secondary" size="sm" onClick={handleChangeFile}>{t("change_file")}</Button>
                    </>
                )}
            </ModalBody>
            {preview && (
                <ModalFooter>
                    <Button color="secondary" onClick={handleClose}>{t("cancel")}</Button>
                    <Button color="primary" onClick={handleSubmit} disabled={isUploading}>{isUploading ? t("uploading") : t("upload_status")}</Button>
                </ModalFooter>
            )}
        </Modal>
    );
};

export default CreateStatusModal;
