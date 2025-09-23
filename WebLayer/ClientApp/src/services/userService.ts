import { friendshipAPI } from './friendshipService';

export const userService = {
  searchUsers: (query: string) => friendshipAPI.searchUsers(query)
};

export default userService;