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
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const { state, fetchMediaResources } = useMediaSources();

  const { user } = useUser();

  useEffect(() => {
    let isCancelled = false;

    if (!user?.id) {
      setProfile(null);
      setProfileError(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    setProfileError(null);

    fetchUserProfile(user.id)
      .then((p) => {
        if (isCancelled) return;
        setProfile(p);
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error("Failed to fetch user profile", error);
        setProfile(null);
        setProfileError("Unable to load user profile. Please retry in a moment.");
      })
      .finally(() => {
        if (isCancelled) return;
        setIsProfileLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

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
        {profileError ? (
          <div className="text-sm text-red-400">{profileError}</div>
        ) : null}
        {isProfileLoading ? (
          <div className="w-full h-full flex items-center">
            <Loader color="#fff" />
          </div>
        ) : (
          <MediaConfiguration state={state} user={profile?.user ?? null} />
        )}
      </SignedIn>
    </div>
  );
};

export default Widget;
