import { useParams } from 'react-router-dom';
import { TagHubPage } from './TagHubPage';
import { TagCombinationPage } from './TagCombinationPage';

/**
 * Smart Router for Tag Pages
 * Decides between TagHubPage and TagCombinationPage
 * based on the presence of '+' in the URL
 */
export function TagRouter() {
  const params = useParams<{ param: string }>();
  const param = params.param || '';

  // If param contains '+', it's a combination
  if (param.includes('+')) {
    return <TagCombinationPage />;
  }

  // Otherwise, it's a hub page
  return <TagHubPage />;
}