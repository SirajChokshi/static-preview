import BitBucket from '../components/icons/BitBucket.svelte'
import GitLab from '../components/icons/GitLab.svelte'
import HTML from '../components/icons/HTML.svelte'
import Github from 'svelte-bootstrap-icons/lib/Github.svelte'
import type { SvelteComponent } from 'svelte'

export interface Resource {
  name: string
  icon: typeof SvelteComponent
}

export enum resourceType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  BITBUCKET = 'BITBUCKET',
  HTML = 'HTML',
}

export const RESOURCES: Record<resourceType, Resource> = {
  [resourceType.GITHUB]: {
    name: 'Github',
    icon: Github,
  },
  [resourceType.GITLAB]: {
    name: 'Gitlab',
    icon: GitLab,
  },
  [resourceType.BITBUCKET]: {
    name: 'BitBucket',
    icon: BitBucket,
  },
  [resourceType.HTML]: {
    name: 'HTML',
    icon: HTML,
  },
}
