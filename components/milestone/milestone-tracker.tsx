import { MilestoneItem } from './milestone-item'
import type { MilestoneWithSubmission } from '@/server/queries/projects'

type Props = {
  milestones: MilestoneWithSubmission[]
  projectId: string
}

type MilestoneStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'AUTO_GOLD'

export function MilestoneTracker({ milestones, projectId }: Props) {
  return (
    <div className="relative">
      {milestones.map(ms => (
        <MilestoneItem
          key={ms.id}
          id={ms.id}
          projectId={projectId}
          order={ms.order}
          name={ms.name}
          description={ms.description}
          status={ms.status as MilestoneStatus}
          isHardGate={ms.isHardGate}
          dueDate={ms.dueDate}
          hasSubmission={ms.submissions.length > 0}
        />
      ))}
    </div>
  )
}
