export const successResponse = (data) => ({ success: true, data, error: null });

export const errorResponse = (error) => ({ success: false, data: null, error });
