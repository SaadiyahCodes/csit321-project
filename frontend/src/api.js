import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", /*url of backend*/
});

export default api;
