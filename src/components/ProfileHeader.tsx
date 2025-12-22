import React from 'react'
import { UserResource } from "@clerk/types";
import CornerElements from "./CornerElements";

const ProfileHeader = ({ user }: { user: UserResource }) => {
    return (
        <div className='mb-10 relative backdrop-blur-sm border-border p-6'>
            <CornerElements />
        </div>
    )
}

export default ProfileHeader