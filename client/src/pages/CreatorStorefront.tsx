import { useParams } from 'react-router-dom';
import { PublicStorefront } from '../components/creator/PublicStorefront';

export default function CreatorStorefront() {
  const { creatorId } = useParams<{ creatorId: string }>();

  return <PublicStorefront storefrontId={creatorId || ''} />;
}
