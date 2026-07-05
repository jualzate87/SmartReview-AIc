import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './styles/App.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Prototype render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <h2>Something went wrong</h2>
          <p>
            The prototype hit a rendering error. This usually means a component
            received unexpected props or is missing a required import.
          </p>
          <p>
            Tell the AI what happened and it will fix it, or use{' '}
            <strong>/restore</strong> to go back to a previous snapshot.
          </p>
          {this.state.error && (
            <div className={styles.errorDetails}>
              {this.state.error.message}
            </div>
          )}
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
