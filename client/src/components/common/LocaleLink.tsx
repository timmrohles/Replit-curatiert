import { Link, LinkProps } from 'react-router-dom';
import { useLocale } from '../../utils/LocaleContext';

interface LocaleLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  skipLocale?: boolean;
}

const ADMIN_PREFIX = '/sys-mgmt-xK9';

export function LocaleLink({ to, skipLocale, ...props }: LocaleLinkProps) {
  const { localePath } = useLocale();

  const resolvedTo = skipLocale || to.startsWith(ADMIN_PREFIX) || to.startsWith('http') || to.startsWith('#')
    ? to
    : localePath(to);

  return <Link to={resolvedTo} {...props} />;
}
