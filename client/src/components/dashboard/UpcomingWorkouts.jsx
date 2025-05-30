import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const UpcomingWorkouts = ({ workouts = [], isLoading = false }) => {
  const navigate = useNavigate();

  const handleWorkoutClick = workoutId => {
    navigate(`/scheduled-workouts/${workoutId}`);
  };

  const handleScheduleWorkout = () => {
    navigate('/scheduled-workouts/new');
  };

  if (isLoading) {
    return (
      <div className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-lg font-medium text-gray-900 dark:text-white'>
          Upcoming Workouts
        </h2>
        <div className='mt-4 flex justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-lg font-medium text-gray-900 dark:text-white'>
          Upcoming Workouts
        </h2>
        <div className='mt-4 text-center py-8'>
          <p className='text-gray-500 dark:text-gray-400'>
            No upcoming workouts scheduled.
          </p>
          <button
            onClick={handleScheduleWorkout}
            className='mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors'
          >
            Schedule Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
      <h2 className='text-lg font-medium text-gray-900 dark:text-white'>
        Upcoming Workouts
      </h2>
      <div className='mt-4 space-y-4'>
        {workouts.map(workout => (
          <div
            key={workout._id || workout.id} // Use _id if available (MongoDB), fallback to id
            onClick={() => handleWorkoutClick(workout._id || workout.id)}
            className='flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer'
          >
            <div>
              <h3 className='text-sm font-medium text-gray-900 dark:text-white'>
                {workout.name || workout.workoutId?.name || 'Workout'}
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {format(new Date(workout.scheduledFor), 'EEE, MMM d')} •{' '}
                {format(new Date(workout.scheduledFor), 'h:mm a')}
              </p>
            </div>
            <button
              onClick={e => {
                e.stopPropagation(); // Prevent triggering the div click
                handleWorkoutClick(workout._id || workout.id);
              }}
              className='text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 p-1'
              aria-label='View workout details'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* View all link */}
      <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <button
          onClick={() => navigate('/scheduled-workouts')}
          className='w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium'
        >
          View all scheduled workouts →
        </button>
      </div>
    </div>
  );
};

export default UpcomingWorkouts;
