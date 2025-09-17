'use client';

import {
  AppleSidebarBadge,
  AppleSidebarHeader,
  AppleSidebarItem,
  AppleSidebarList,
  AppleSidebarMain,
  AppleSidebarPanel,
  AppleSidebarProvider,
  AppleSidebarSection,
  AppleSidebarTrigger,
} from './AppleSidebar';

import { Button } from '@/components/ui/button';

export function AppleSidebarDemo() {
  return (
    <AppleSidebarProvider>
      <AppleSidebarPanel>
        <AppleSidebarHeader>
          <AppleSidebarTrigger />
          <span className="text-sm font-medium">VitalSense</span>
        </AppleSidebarHeader>
        <AppleSidebarSection>
          <div className="text-xs px-2 pb-2 font-medium text-gray-500">
            Quick Access
          </div>
          <AppleSidebarList>
            <AppleSidebarItem active>Dashboard</AppleSidebarItem>
            <AppleSidebarItem>
              Health Alerts
              <AppleSidebarBadge>3</AppleSidebarBadge>
            </AppleSidebarItem>
            <AppleSidebarItem>Activity</AppleSidebarItem>
          </AppleSidebarList>
        </AppleSidebarSection>
        <AppleSidebarSection>
          <div className="text-xs px-2 pb-2 font-medium text-gray-500">All</div>
          <AppleSidebarList>
            {Array.from({ length: 20 }).map((_, i) => (
              <AppleSidebarItem key={`item-${i + 1}`}>
                Menu Item {i + 1}
              </AppleSidebarItem>
            ))}
          </AppleSidebarList>
        </AppleSidebarSection>
      </AppleSidebarPanel>
      <AppleSidebarMain className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <AppleSidebarTrigger />
          <Button variant="outline">Action</Button>
        </div>
        <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={`card-${i + 1}`}
              className="rounded-lg border p-4 shadow-sm"
            >
              <div className="mb-2 font-medium">Card {i + 1}</div>
              <p className="text-gray-600 text-sm">
                Sample content to demonstrate main area bumping as the sidebar
                expands/collapses.
              </p>
            </div>
          ))}
        </div>
      </AppleSidebarMain>
    </AppleSidebarProvider>
  );
}

export default AppleSidebarDemo;
