export interface HelpTabItem {
  id: string
  title: string
  slug: string
  dataId?: number | string
  content?: string
}

export interface PageItem extends HelpTabItem {
  content: string
  dataId: number | string
}

export interface HelpHeaderProps {
  activeTab: string
  setActiveTab: (id: string) => void
  setOpen: (id: boolean) => void
  tabArray: HelpTabItem[]
}

export interface PagesProps {
  data: PageItem
  isLoading: boolean
  isRefetching: boolean
}
