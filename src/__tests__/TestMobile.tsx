export function TestMobile() {
  console.log('🧪 TestMobile: Component is rendering');

  return (
    <div
      style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'blue',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
      }}
    >
      🧪 TEST MOBILE COMPONENT IS WORKING! 🧪
    </div>
  );
}
