import React, { useEffect, useState } from 'react';
import { Check, Edit } from 'react-feather';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import type { AccountPayload, UpdateProfileResponse, User } from '../../../../../types/api';
import ProfileAvatar from './ProfileAvatar';

interface UpdateProfileMutation {
    mutateAsync: (variables: AccountPayload) => Promise<UpdateProfileResponse>;
    isPending: boolean;
}
interface ProfileSectionProps {
    user: User | undefined;
    updateProfile: UpdateProfileMutation;
    refetch: () => Promise<void>;
    t: (key: string) => string;
}

interface ProfileState {
    username: string;
    country: string;
    editStatus: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    user,
    updateProfile,
    refetch,
    t,
}) => {
    const [profile, setProfile] = useState<ProfileState>({
        username: '',
        country: '',
        editStatus: false,
    });

    useEffect(() => {
        if (user) {
            setProfile({
                username: user.name || '',
                country: user.country || '',
                editStatus: false,
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const toggleEdit = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setProfile((prev) => ({ ...prev, editStatus: !prev.editStatus }));
    };

    const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (updateProfile.isPending || !profile.username.trim()) return;

        try {
            const payload = {
                name: profile.username.trim(),
                country: profile.country.trim() || '',
            };
            await updateProfile.mutateAsync(payload);
            setProfile((prev) => ({ ...prev, editStatus: false }));
            await refetch();
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const displayName = profile.editStatus ? profile.username : (user?.name || t('settings_default_user'));
    const displayCountry = profile.editStatus
        ? (profile.country || t('settings_no_location'))
        : (user?.country || t('settings_no_location'));

    return (
        <div className="profile-box">
            <div className={`d-flex ${profile.editStatus ? 'open' : ''}`}>
                <ProfileAvatar user={user} />
                <div className="details pt-0">
                    <h4>{displayName}</h4>
                    <h6 className="font-light">{displayCountry}</h6>
                </div>
                {profile.editStatus && (
                    <div className="details edit">
                        <Form className="form-radius form-sm">
                            <FormGroup>
                                <Input
                                    type="text"
                                    name="username"
                                    value={profile.username}
                                    onChange={handleInputChange}
                                    placeholder={t('settings_name_placeholder')}
                                    aria-label={t('settings_name_label')}
                                />
                            </FormGroup>
                            <FormGroup className="m-0">
                                <Input
                                    type="text"
                                    name="country"
                                    value={profile.country}
                                    onChange={handleInputChange}
                                    placeholder={t('settings_country_placeholder')}
                                    aria-label={t('settings_country_label')}
                                />
                            </FormGroup>
                        </Form>
                    </div>
                )}
                <div className="flex-grow-1 d-flex justify-content-end">
                    {profile.editStatus ? (
                        <Button
                            color="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={updateProfile.isPending || !profile.username.trim()}
                            aria-label={t('settings_save_label')}
                        >
                            {updateProfile.isPending ? t('settings_saving') : (
                                <>
                                    <Check className="mr-1" aria-hidden="true" /> {t('settings_save')}
                                </>
                            )}
                        </Button>
                    ) : (
                        <a
                            className="icon-btn btn-outline-light btn-sm pull-right edit-btn"
                            onClick={toggleEdit}
                            aria-label={t('settings_edit_label')}
                        >
                            <Edit aria-hidden="true" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;