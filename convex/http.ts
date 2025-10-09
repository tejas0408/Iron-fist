import { httpRouter, HttpRouter } from "convex/server";
import {WebHookEvent} from "@clerk/nextjs/server";
import { Webhook } from "svix";
import{api} from "./_generated/api";

const http = httpRouter()

