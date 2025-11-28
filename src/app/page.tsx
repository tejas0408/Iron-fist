import React from 'react'

const Homepage = () => {
  return (
    <div className='flex flex-col min0h-screen text-foreground overflow-hidden'>
      <section className='realtive z-10 py-24 flex-grow'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative'>
          {/**Corner decoration */}
          <div className='absolute -top-10 left-0 w-40 h-10 border-l-2 border-t-2 border-border'/>
          {/*Left side */}
          <div className='lg:col-span-7 space-y-8 relative'>

          </div>
          </div>

        </div>
      </section>
    </div>
  )
}

export default Homepage;