import {
  AttachmentListSchema,
  AttachmentSchema,
  CreateUploadResponseSchema,
  type CreateUploadRequest,
} from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

type Token = string | null;

/** Registers one file and returns the signed Transloadit options to upload it with. */
export const createUpload = (file: CreateUploadRequest, token: Token) =>
  request("/api/v1/uploads", CreateUploadResponseSchema, {
    method: "POST",
    body: JSON.stringify(file),
    token,
  });

/** After the upload: the server checks the Transloadit job and returns the file's status. */
export const completeUpload = (id: string, assemblyId: string, token: Token) =>
  request(`/api/v1/uploads/${encodeURIComponent(id)}/complete`, AttachmentSchema, {
    method: "POST",
    body: JSON.stringify({ assemblyId }),
    token,
  });

/** The "Select Asset" library: the user's ready uploads, newest first. */
export const listUploads = (cursor: string | undefined, token: Token) =>
  request(
    `/api/v1/uploads${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    AttachmentListSchema,
    { token },
  );
