const apiUrl = import.meta.env.VITE_API_URL;

export const GenerateEstimationCostApi = async (
    username: string,
    refNum: string,
    equipment: {
        itemno: string;
        itemname: string;
        unit: string;
        qty: number;
        status: string;
        remarks: string;
    }[],
) => {
  try {
    const response = await fetch(`${apiUrl}/api/generate-estimation-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, refNum, equipment }),
    });
    if (!response.ok) {
      throw new Error('Failed to generate estimation cost');
    }
    return await response.json();
  } catch (error) {
    console.error('Error generating estimation cost:', error);
    throw error;
  }
}