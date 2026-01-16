import {
  NotebookImportance,
  NotebookStatus,
  NotebookTagTheme,
  type BetterbrainUser,
} from "#/types/notebook";

export const getUserNameOrEmail = (user: BetterbrainUser) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  } else if (user.first_name) {
    return user.first_name;
  } else {
    return user.email?.toLocaleLowerCase() || "";
  }
};

export function getProjectTagColors(theme: NotebookTagTheme) {
  switch (theme) {
    case NotebookTagTheme.Blue:
      return "bg-blue-100 text-blue-600";

    case NotebookTagTheme.Gray:
      return "bg-gray-200 text-gray-700";

    case NotebookTagTheme.Green:
      return "bg-green-200 text-green-700";

    case NotebookTagTheme.Violet:
      return "bg-violet-200 text-violet-800";

    case NotebookTagTheme.Red:
      return "bg-red-200 text-red-700";

    case NotebookTagTheme.Pink:
      return "bg-pink-100 text-pink-700";

    case NotebookTagTheme.Yellow:
      return "bg-yellow-100 text-yellow-600";

    default:
      return "bg-gray-200 text-gray-700";
  }
}

export function getStatusEnum(status: string) {
  switch (status) {
    case NotebookStatus.InProgress:
    case "In Progress":
      return NotebookStatus.InProgress;

    case NotebookStatus.Completed:
    case "Complete":
      return NotebookStatus.Completed;

    case NotebookStatus.Blocked:
    case "Blocked":
      return NotebookStatus.Blocked;

    default:
      return NotebookStatus.NotStarted;
  }
}

export const getImportanceEnum = (importance: string) => {
  switch (importance as NotebookImportance) {
    case NotebookImportance.Critical:
    case "Critical" as NotebookImportance: // Workaround for legacy.
      return NotebookImportance.Critical;

    case NotebookImportance.High:
    case "High" as NotebookImportance: // Workaround for legacy.
      return NotebookImportance.High;

    case NotebookImportance.Medium:
    case "Medium" as NotebookImportance: // Workaround for legacy.
      return NotebookImportance.Medium;

    case NotebookImportance.Low:
    case "Low" as NotebookImportance: // Workaround for legacy.
      return NotebookImportance.Low;

    case NotebookImportance.Backlog:
    case "Backlog" as NotebookImportance: // Workaround for legacy.
      return NotebookImportance.Backlog;

    default:
      console.error("Unknown importance", { importance });
      return NotebookImportance.Low;
  }
};

export const getImportanceTagTheme = (importance: string) => {
  switch (importance as NotebookImportance) {
    case NotebookImportance.Critical:
    case "Critical" as NotebookImportance: // Workaround for legacy.
      return NotebookTagTheme.Violet;

    case NotebookImportance.High:
    case "High" as NotebookImportance: // Workaround for legacy.
      return NotebookTagTheme.Red;

    case NotebookImportance.Medium:
    case "Medium" as NotebookImportance: // Workaround for legacy.
      return NotebookTagTheme.Yellow;

    case NotebookImportance.Low:
    case "Low" as NotebookImportance: // Workaround for legacy.
      return NotebookTagTheme.Green;

    default:
      return NotebookTagTheme.Gray;
  }
};
