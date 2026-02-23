export const COPY_KEYS = {
  follow: 'microcopy.follow',
  unfollow: 'microcopy.unfollow',
  bookmark: 'microcopy.bookmark',
  bookmarked: 'microcopy.bookmarked',
  share: 'microcopy.share',
  buyAt: 'microcopy.buyAt',

  emptyNoBooksTitle: 'microcopy.empty.noBooksTitle',
  emptyNoBooksDescription: 'microcopy.empty.noBooksDescription',
  emptyNoResultsTitle: 'microcopy.empty.noResultsTitle',
  emptyNoResultsDescription: 'microcopy.empty.noResultsDescription',
  emptyNoFavoritesTitle: 'microcopy.empty.noFavoritesTitle',
  emptyNoFavoritesDescription: 'microcopy.empty.noFavoritesDescription',
  emptyNoCuratorsTitle: 'microcopy.empty.noCuratorsTitle',
  emptyNoCuratorsDescription: 'microcopy.empty.noCuratorsDescription',
  emptyNoEventsTitle: 'microcopy.empty.noEventsTitle',
  emptyNoEventsDescription: 'microcopy.empty.noEventsDescription',

  errorGenericTitle: 'microcopy.error.genericTitle',
  errorGenericDescription: 'microcopy.error.genericDescription',
  errorLoadingTitle: 'microcopy.error.loadingTitle',
  errorLoadingDescription: 'microcopy.error.loadingDescription',
  errorNetworkTitle: 'microcopy.error.networkTitle',
  errorNetworkDescription: 'microcopy.error.networkDescription',

  successSaved: 'microcopy.success.saved',
  successDeleted: 'microcopy.success.deleted',
  successCopied: 'microcopy.success.copied',
  successUpdated: 'microcopy.success.updated',

  confirmDelete: 'microcopy.confirm.delete',
  confirmDiscard: 'microcopy.confirm.discard',

  tryAgain: 'microcopy.tryAgain',
  linkCopied: 'microcopy.linkCopied',
  shareNotSupported: 'microcopy.shareNotSupported',

  loading: 'common.loading',
  save: 'common.save',
  cancel: 'common.cancel',
  delete: 'common.delete',
  edit: 'common.edit',
  close: 'common.close',
  back: 'common.back',
  search: 'common.search',
  showMore: 'common.showMore',
  showLess: 'common.showLess',
  noResults: 'common.noResults',
  backToHome: 'common.backToHome',
} as const;

export type CopyKey = (typeof COPY_KEYS)[keyof typeof COPY_KEYS];

export const COPY_TONE = {
  style: 'ruhig, präzise, menschlich, nicht werblich',
  rules: [
    'Keine Ausrufezeichen in Fehlermeldungen',
    'Immer Handlungsoptionen bieten',
    'Duzen (du/dein), nicht Siezen',
    'Fachbegriffe nur wo nötig',
  ],
} as const;
