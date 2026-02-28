import JobDetailsClient from './JobDetailsClient';

export const generateStaticParams = () => {
    return [];
};

export default function JobDetailsPage({ params }) {
    return <JobDetailsClient jobId={params.id} />;
}
