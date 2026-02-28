import ProfileClient from './ProfileClient';

export const generateStaticParams = () => {
    return [];
};

export default function PublicProfilePage({ params }) {
    return <ProfileClient targetId={params.id} />;
}
