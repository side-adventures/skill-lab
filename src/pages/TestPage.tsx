import { Link, useParams } from 'react-router-dom'
import { TestRunner } from '../components/TestRunner'
import { getTest } from '../tests/registry'

export function TestPage() {
  const { id = '' } = useParams()
  const test = getTest(id)
  if (!test) {
    return (
      <p className="py-20 text-center">
        Test not found. <Link to="/" className="text-violet-600 hover:underline">See all tests</Link>
      </p>
    )
  }
  // key: reset runner state when navigating between tests
  return <TestRunner key={test.id} test={test} />
}
