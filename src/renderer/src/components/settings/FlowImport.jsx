import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { H5, Body2 } from '../common/Typography';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';
const FlowImport = () => {
  const [importStatus, setImportStatus] = useState(null);
  const api = useApi();
  const { user } = useAuth();
  const handleFileSelect = async () => {
    try {
      // Use Electron's file dialog via our API bridge
      const file = await api.file.open({
        filters: [
          { extensions: ['json'] }
        ],
        properties: ['openFile']
      });

      console.log(file);

      if (!file) return; // User cancelled

      // Parse the file content
      const flowData = JSON.parse(file.response.data);

      // Validate flow structure
      if (!flowData.nodes || !flowData.edges || !flowData.name) {
        throw new Error('Invalid flow file structure');
      }

      // Send to main process for import
      const result = await window.api.invoke('flow:import', {
        flow: {
          ...flowData,
          // Remove the original ID to let the backend generate a new one
          // add our user id
          id: undefined,
          timestamp: Date.now(),
          user_id: user.id
        }
      });

      if (result.success) {
        setImportStatus({
          success: true,
          message: `Successfully imported flow: ${flowData.name}`
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Flow import failed:', error);
      setImportStatus({
        success: false,
        message: `Import failed: ${error.message}`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <H5>Import Flows</H5>
          <Body2 className="text-slate-500">
            Import flow configurations from JSON files
          </Body2>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outlined"
            color="blue"
            size="md"
            startIcon={<Upload className="w-4 h-4" />}
            onClick={handleFileSelect}
          >
            Select File
          </Button>
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${
            importStatus.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default FlowImport; 