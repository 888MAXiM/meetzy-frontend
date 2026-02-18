import React from 'react';
import type { User } from '../../../../../types/api';
import { Image } from '../../../../../shared/image';

interface ProfileAvatarProps {
    user: User | undefined;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ user }) => {
    const initial = user?.name?.charAt(0).toUpperCase() || 'U';
    const defaultColor = '#1abc9c';

    const avatarStyle = {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: defaultColor,
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold' as const,
    };

    return (
        <div className="profile">
            {user?.avatar ? (
                <Image
                    className="bg-img"
                    src={user.avatar}
                    alt={`${user.name || 'User'} avatar`}
                    width={50}
                    height={50}
                />
            ) : (
                <div
                    className="bg-img d-flex align-items-center justify-content-center"
                    style={avatarStyle}
                    aria-label={`Avatar initial: ${initial}`}
                    role="img"
                >
                    {initial}
                </div>
            )}
        </div>
    );
};

export default ProfileAvatar;