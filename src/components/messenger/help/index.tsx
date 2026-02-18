import { useState } from 'react'
import FaqsSection from './FaqsSection'
import Header from './Header'
import { TabContent, TabPane } from 'reactstrap'
import { queries } from '../../../api'
import Pages from './Pages'
import Footer from './Footer'
import { useTableManager } from '../../../utils/useTablemanager'
import { HelpTabItem, PageItem } from '../../../types/components/help'
import { SinglePage } from '../../../types/api'
import Contact from './Contact'

const HelpSection = () => {
  const [activeTab, setActiveTab] = useState('1')
  const [open, setOpen] = useState(true)
  const { params } = useTableManager()
  const { data, isLoading, isRefetching } = queries.useGetPages(params)
  const baseItem: HelpTabItem[] = [{ id: '1', title: 'FAQs', slug: 'faqs' }]
  const otherArray: PageItem[] =
    data?.data?.pages
      .filter((page: SinglePage) => page.status)
      .map(
        (item: SinglePage, index: number): PageItem => ({
          id: `${index + baseItem.length + 1}`,
          dataId: item.id,
          title: item.title,
          slug: item.slug,
          content: item.content,
        }),
      )
      .reverse() ?? []

  const tabArray: HelpTabItem[] = [...baseItem, ...otherArray]

  return (
    <div className="faq-section-wrapper">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} setOpen={setOpen} tabArray={tabArray} />
      <div className="main-help">
        {open ? (
          <TabContent className="w-100 justify-content-center" activeTab={activeTab}>
            <TabPane tabId="1">
              <FaqsSection />
            </TabPane>
            {otherArray.map((item) => (
              <TabPane tabId={item.id} key={item.id}>
                <Pages data={item} isLoading={isLoading} isRefetching={isRefetching} />
              </TabPane>
            ))}
          </TabContent>
        ) : (
          <Contact />
        )}
      </div>
      <Footer />
    </div>
  )
}

export default HelpSection
