(function () {
  const CSV_COLUMNS = ['saturation', 'edge', 'grey', 'zone', 'health'];

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function buildCsv(records) {
    const lines = [CSV_COLUMNS.join(',')];
    records.forEach((record) => {
      lines.push(CSV_COLUMNS.map((column) => csvEscape(record[column])).join(','));
    });
    return lines.join('\n');
  }

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportDatasetFromFiles(fileList, filename = 'blutrack_dataset.csv') {
    if (!window.BluTrackML || typeof window.BluTrackML.analyzeImageFile !== 'function') {
      throw new Error('BluTrack ML helpers are unavailable.');
    }

    const files = Array.from(fileList || []);
    const records = [];
    const skipped = [];

    for (const file of files) {
      try {
        const analysis = await window.BluTrackML.analyzeImageFile(file);
        if (analysis.error) {
          skipped.push({ file: file.name, error: analysis.error });
          continue;
        }
        records.push(window.BluTrackML.toDatasetRecord(analysis));
      } catch (error) {
        skipped.push({ file: file.name, error: error.message || 'Unknown export error.' });
      }
    }

    downloadCsv(buildCsv(records), filename);
    return { processed: records.length, skipped, records };
  }

  async function promptAndExport(filename = 'blutrack_dataset.csv') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.click();

    const files = await new Promise((resolve) => {
      input.addEventListener('change', () => resolve(input.files), { once: true });
    });

    return exportDatasetFromFiles(files, filename);
  }

  window.BluTrackDatasetExporter = {
    csvColumns: CSV_COLUMNS,
    exportDatasetFromFiles,
    promptAndExport
  };
})();
