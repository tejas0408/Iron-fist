import React from 'react'
import { UserResource } from "@clerk/types";

const ProfileHeader = ({ user }: { user: UserResource }) => {
    return (
        <div>
            <div className="flex items-center gap-4">
                <img src={user.imageUrl} alt="" />
                <div>
                    <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                    <p className="text-gray-500">{user.email}</p>
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader