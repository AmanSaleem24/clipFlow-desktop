import { ClerkLoading, SignedIn, useUser } from "@clerk/clerk-react";
import Loader from "../Loader";
import { useEffect, useState } from "react";
import { fetchUserProfile } from "@/lib/utils";
import { useMediaSources } from "@/hooks/useMediaSources";
import MediaConfiguration from "../MediaConfiguration";

const Widget = () => {
  const [profile, setProfile] = useState<{
    status: number;
    user:
      | ({
          subscription: {
            plan: "PRO" | "FREE";
          } | null;
          studio: {
            id: string;
            screen: string | null;
            mic: string | null;
            preset: "HD" | "SD";
            camera: string | null;
            pundit: string | null;
            userId: string | null;
          } | null;
        } & {
          id: string;
          email: string;
          firstname: string | null;
          lastname: string | null;
          createdAt: Date;
          clerkid: string;
        })
      | null;
  } | null>(null);

  const { state, fetchMediaResources } = useMediaSources();

  const { user } = useUser();

  useEffect(() => {
    if (user && user.id) {
      fetchUserProfile(user.id).then((p) => setProfile(p));
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    fetchMediaResources();
  }, [fetchMediaResources, user?.id]);

  return (
    <div className="p-5">
      <ClerkLoading>
        <div className="h-full flex justify-center items-center">
          <Loader />
        </div>
      </ClerkLoading>
      <SignedIn>
        {state.error ? (
          <div className="text-sm text-red-400">{state.error}</div>
        ) : null}
        {profile ? (
          <MediaConfiguration state={state} user={profile?.user} />
        ) : (
          <div className="w-full h-full flex items-center">
            <Loader color="#fff" />
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default Widget;
