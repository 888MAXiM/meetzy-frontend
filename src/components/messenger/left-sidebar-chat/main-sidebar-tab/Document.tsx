import { Fragment, useState } from 'react'
import { queries } from '../../../../api'
import { SvgIcon } from '../../../../shared/icons'
import { formatDate } from '../../../../utils'
import {
  downloadFile,
  getDocumentColorClass,
  getDocumentIconId,
  shareFile,
} from '../../../../utils/custom-functions/useFilePreview'
import { useDebounce } from '../../../../utils/useDebounce'
import CommonLeftHeading from './common/CommonLeftHeading'
import { Image } from '../../../../shared/image'
import { ImagePath } from '../../../../constants'
import { useTranslation } from 'react-i18next'

const Document = () => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)

  const { data: documentsData, isLoading, error } = queries.useGetDocuments(page, 20)
  const { data: searchResults } = queries.useSearchDocuments(debouncedSearch)

  const displayData = debouncedSearch ? searchResults?.documents : documentsData?.documents

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const loadMore = () => {
    if (documentsData?.hasMore && !debouncedSearch) {
      setPage((prev) => prev + 1)
    }
  }

  if (isLoading && page === 1) {
    return (
      <Fragment>
        <CommonLeftHeading
          title={'document'}
          subTitle={'listing_of_records'}
          search
          onSearchChange={handleSearchChange}
        />
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Fragment>
    )
  }

  if (error) {
    return (
      <Fragment>
        <CommonLeftHeading
          title={'document'}
          subTitle={'listing_of_records'}
          search
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <div className="text-center p-4 text-danger">Error loading documents. Please try again.</div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <CommonLeftHeading
        title={'document'}
        subTitle={'listing_of_records'}
        search
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <ul className="chat-main">
        {!displayData || displayData.length === 0 ? (
          <li className="border-0">
            <div className="text-center p-4 text-muted">
              {searchTerm ? (
                'No documents found matching your search.'
              ) : (
                <div className="empty-state text-center">
                  <div className="mb-3">
                    <Image src={`${ImagePath}/gif/download.gif`} />
                  </div>
                  <h5>{t('No documents')}</h5>
                  <p className="text-muted">You don't have any documents at the moment</p>
                </div>
              )}
            </div>
          </li>
        ) : (
          displayData?.map((group, groupIndex) => {
            return (
              <Fragment key={groupIndex}>
                <li className="border-0">
                  <div className="date-label">
                    <h6 className="text-muted">{group.dateLabel}</h6>
                  </div>
                </li>
                {group.documents.map((doc) => {
                  return (
                    <li key={doc.id} className="border-0">
                      <div className="chat-box document-chatbox">
                        <div className="d-flex gap-2">
                          <a
                            className={`icon-btn document-icon-btn ${getDocumentColorClass(
                              doc.file_type,
                              doc.message_type,
                            )}`}
                            onClick={(e) => e.preventDefault()}
                          >
                            <SvgIcon iconId={getDocumentIconId(doc.file_type, doc.message_type)} />
                          </a>
                          <div className="details">
                            <h6>{doc.file_name || 'Untitled Document'}</h6>
                            <p>
                              {formatDate(doc?.created_at) || doc.group?.name || 'Unknown'} • {doc.message_type}
                            </p>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              className="icon-btn document-svg btn-outline-light btn-sm pull-right"
                              onClick={() => downloadFile(doc.file_url, doc.file_name)}
                              title="Download"
                            >
                              <SvgIcon iconId="download" />
                            </button>
                            <button
                              className="icon-btn btn-outline-light btn-sm pull-right"
                              onClick={() => shareFile(doc.file_url, doc.file_name)}
                              title="Copy"
                            >
                              <SvgIcon iconId="copy" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </Fragment>
            )
          })
        )}
      </ul>

      {!debouncedSearch && documentsData?.hasMore && (
        <div className="text-center p-3">
          <button className="btn btn-outline-primary" onClick={loadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </Fragment>
  )
}

export default Document
