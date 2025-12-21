"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react";
import { getUserPlans } from "../../../convex/plans";
import { api } from "../../../convex/_generated/api";

const ProfilePage = () => {
  const { user } = useUser();
  const userId = user?.id as string;

  const allPlans = useQuery(api.plans.getUserPlans, { userId });

  return <div>
  </div>;

}
export default ProfilePage;