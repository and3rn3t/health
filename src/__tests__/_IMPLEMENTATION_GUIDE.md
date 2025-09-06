# 🚀 Quick Start: Critical Testing Implementation

## Step 1: Install Testing Dependencies

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

## Step 2: Update Configuration Files

See `_TESTING_WITH_ESBUILD.md` for the complete vitest.config.ts and vitest.setup.ts updates.

## Step 3: Priority Test Implementation

### 🎯 **Phase 1: Branding Tests** (Immediate - This Week)

**File**: `src/__tests__/branding/vitalsense-branding.test.tsx`

**Tests**:

- ✅ VitalSense color palette validation
- ✅ Brand text consistency (no "Health App" references)
- ✅ Component branding compliance
- ✅ Theme color verification

**Status**: Ready to run once dependencies installed

### 🧭 **Phase 2: Navigation Tests** (Week 2)

**Files**:

- `src/__tests__/navigation/navigation-header.test.tsx`
- `src/__tests__/navigation/sidebar.test.tsx`

**Critical Tests**:

```typescript
// Navigation header functionality
it('should switch tabs correctly', () => {
  const onNavigate = vi.fn();
  render(<NavigationHeader {...props} onNavigate={onNavigate} />);

  fireEvent.click(screen.getByText('Analytics'));
  expect(onNavigate).toHaveBeenCalledWith('analytics');
});

// Emergency trigger accessibility
it('should have accessible emergency trigger', () => {
  render(<NavigationHeader {...props} />);

  const emergencyTrigger = screen.getByRole('button', { name: /emergency/i });
  expect(emergencyTrigger).toBeInTheDocument();
});
```

### 🔌 **Phase 3: WebSocket Tests** (Week 3)

**Files**:

- `src/__tests__/websocket/connection.test.tsx`
- `src/__tests__/websocket/message-processing.test.tsx`

**Critical Tests**:

```typescript
// Connection resilience
it('should reconnect after disconnection', async () => {
  const mockWS = new MockWebSocket();
  // Test reconnection logic
});

// Message validation
it('should validate message envelopes', () => {
  const validMessage = {
    type: 'live_health_update',
    data: { heartRate: 72 },
    timestamp: new Date().toISOString(),
  };

  expect(messageEnvelopeSchema.parse(validMessage)).toBeTruthy();
});
```

### 🔗 **Phase 4: API Tests** (Week 4)

**Files**:

- `src/__tests__/api/health-endpoints.test.tsx`
- `src/__tests__/api/auth.test.tsx`

**Critical Tests**:

```typescript
// Health data submission
it('should submit health data successfully', async () => {
  const mockData = { heartRate: 72, steps: 5000 };

  const response = await fetch('/api/health-data', {
    method: 'POST',
    body: JSON.stringify(mockData),
  });

  expect(response.status).toBe(201);
});
```

## Step 4: Run the Tests

```bash
# Run all tests
npm run test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage

# Visual test runner
npm run test:ui
```

## Step 5: Validate Critical Areas

### **Immediate Validation Checklist**

- [ ] **Branding**: No "Health App" references remain
- [ ] **Colors**: VitalSense color palette used consistently
- [ ] **Navigation**: Tab switching works correctly
- [ ] **Emergency**: Emergency trigger accessible from all pages
- [ ] **WebSocket**: Connection handles disconnection gracefully
- [ ] **API**: Health data endpoints validate input correctly

### **Success Criteria**

✅ **Brand Consistency**: 100% VitalSense branding, zero generic references

✅ **Navigation**: All navigation paths tested and working

✅ **Real-time**: WebSocket resilience tested under failure conditions

✅ **API Integration**: All critical endpoints tested with proper validation

✅ **Component Reliability**: All active components render without errors

## Quick Command Reference

```bash
# Install everything at once
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw

# Run specific test suites
npm run test -- branding
npm run test -- navigation
npm run test -- websocket
npm run test -- api

# Debug failing tests
npm run test:watch -- --reporter=verbose
```

---

**Goal**: Comprehensive test coverage for all critical VitalSense functionality ensuring reliable, brand-consistent, and well-functioning health monitoring platform.

**Timeline**: 4 weeks to complete all critical testing areas with immediate focus on branding validation.
