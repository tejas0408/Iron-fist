"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react";
import { getUserPlans } from "../../../convex/plans";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

const ProfilePage = () => {
  const { user } = useUser();
  const userId = user?.id as string;

  const allPlans = useQuery(api.plans.getUserPlans, { userId });

  const [selectedPlanId, setSelectedPlanId] = useState<null | string>(null);
  const activePlan = allPlans?.find(plan => plan.isActive);
  const currentPlan = selectedPlanId ? allPlans?.find(plan => plan._id === selectedPlanId) : activePlan;

  return <div>
  </div>;

}
export default ProfilePage;